// Web search tool — SearXNG integration
// Optional: disabled by default, enabled via SEARCH_ENABLED env var

interface WebSearchResult {
  title: string;
  url: string;
  content: string;
}

export function isWebSearchEnabled(): boolean {
  return process.env.SEARCH_ENABLED === "true";
}

export async function executeWebSearch(query: string, maxResults: number = 5): Promise<string> {
  const searchUrl = process.env.SEARCH_URL;
  if (!searchUrl) {
    return JSON.stringify({ error: "Web search not configured. Set SEARCH_URL env var." });
  }

  try {
    const response = await fetch(
      `${searchUrl}/search?q=${encodeURIComponent(query)}&format=json&categories=general&language=id`,
      {
        method: "GET",
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      return JSON.stringify({ error: `Search API returned ${response.status}` });
    }

    const data = await response.json() as { results?: WebSearchResult[] };
    const results = (data.results || []).slice(0, maxResults);

    if (results.length === 0) {
      return JSON.stringify({ results: [], message: "Tidak ada hasil ditemukan." });
    }

    const formatted = results.map((r) => ({
      title: r.title,
      url: r.url,
      snippet: (r.content || "").slice(0, 300),
    }));

    return JSON.stringify({ results: formatted });
  } catch (err) {
    return JSON.stringify({ error: `Search failed: ${(err as Error).message}` });
  }
}
