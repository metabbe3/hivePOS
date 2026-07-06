# Spec: Codebase RAG (structural index + retrieval)

Status: building. Source: the user's blueprint (AST extraction, per-symbol
schema, hash-based delta sync, minimize LLM calls, maximize data quality).

## Problem

Navigating a 686-file TS/TSX codebase by grep/Read thrash is slow + token-heavy.
A structural index lets an agent (or dev) jump straight to the right symbol with
its signature, location, and call context — one cheap query instead of many reads.

## Principles (from the blueprint)

1. **AST extraction, not LLM.** Slice code into structural chunks (one chunk =
   one function/class/component) via a parser. Never burn an LLM call just to
   *locate* symbols.
2. **Minimize LLM calls.** Summaries default to deterministic (JSDoc + signature)
   — zero LLM at index time. The optional `--llm-summarize` path calls the LLM
   only for chunks lacking JSDoc, and only on changed chunks (delta sync).
3. **Maximize data quality.** Store rich, hard metadata per symbol (location,
   inputs, outputs, call context, hash) — not prose approximations.
4. **Delta sync.** Per-symbol SHA-256; re-extract/re-summarize only changed
   symbols; delete missing. The index tracks the code, not a snapshot.

## Implementation choices

- **Parser: TypeScript compiler API** (`typescript`, already installed). For a
  TS/TSX-dominant repo it is the most accurate AST (type-aware, native JSX).
  Tree-sitter would be the pick for a polyglot repo; not needed here.
- **Storage: a JSON file** (`.codebase-rag/index.json`) + JS retrieval. At
  codebase scale (~1k symbols) in-memory search is sub-ms; no DB service, no
  native module, no app-DB schema change. (Upgrade path: SQLite-FTS5 for larger
  corpora, or embeddings via the local Ollama for semantic search — see below.)
- **Retrieval: weighted lexical** over (name > signature > summary). Lexical-on-
  summary is effective for code (symbols are named precisely) and avoids the
  embedding-model/running-LLM dependency entirely — the most LLM-light option.
- **Embeddings (optional, not in MVP):** when semantic search is wanted, embed
  the `summary` via the local Ollama (`LLM_API_URL/api/embeddings`,
  `nomic-embed-text`) and store the vector in the JSON record; query does cosine
  in JS. No pgvector/Chroma needed at this scale.

## Per-symbol schema (the "database row")

| field | type | description |
|---|---|---|
| `id` | string | `relativePath:symbolName` (unique) |
| `name` | string | exact symbol name |
| `kind` | string | `function` \| `component` \| `class` \| `hook` \| `type` \| `interface` \| `const` \| `route` |
| `file_path` | string | repo-relative path |
| `startLine` / `endLine` | number | 1-based, for jump-to-edit |
| `inputs` | array | parameters (name + type) |
| `outputs` | string | return type / JSX element / inferred |
| `summary` | string | JSDoc if present, else synthesized from signature. **The retrieval key.** |
| `called_by` | array | symbol ids that reference this one (second pass) |
| `file_hash` | string | SHA-256 of the symbol's source snippet (delta-sync key) |
| `code` | string | the source snippet (for the LLM to read on a hit) |

## Commands (`npx tsx scripts/codebase-rag.ts …`)

- `index` — walk `app/ components/ lib/ modules/ hooks/`, AST-extract symbols,
  SHA-256 delta-sync against the existing index, recompute `called_by`. Default
  summaries are deterministic; `--llm-summarize` enriches doc-less chunks via
  Ollama (only changed ones).
- `query <term>` — weighted lexical search → top-K symbols with full metadata.
- `symbol <name>` — exact-name lookup.
- `callers <name>` — who references this symbol.
- `stats` — index size / coverage.

## Delta-sync loop (also the CI job)

1. Detect changed files (mtime vs index, or `git diff`).
2. Re-parse changed files; extract symbols.
3. For each symbol: `sha256(code)`; if unchanged → keep; if changed → update
   (re-summarize only if `--llm-summarize`); if a stored symbol is gone → delete.
4. Recompute `called_by` (cheap second pass over all `code`).
5. Write `.codebase-rag/index.json`.

## CI/CD (`.github/workflows/codebase-rag.yml`)

On push to `main`: run `npx tsx scripts/codebase-rag.ts index`, upload the
`.codebase-rag/index.json` artifact. Keeps a shared, current index without
re-scanning the whole repo (delta sync). Local agents index locally; CI keeps
the canonical artifact for the team.

## Acceptance criteria (QA pass/fail)

- `index` completes on hivePOS in seconds, produces `.codebase-rag/index.json`.
- `query "record payment"` returns `RecordPaymentService.execute` (file:line) in
  the top hits, with inputs/outputs/summary.
- `callers RecordPaymentService` returns its call sites.
- Re-running `index` with no changes is a no-op (delta sync — hashes match).
- Editing one function + `index` updates only that symbol.
- `npx tsc --noEmit` on the script is clean.
