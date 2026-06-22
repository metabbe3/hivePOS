// Entity extraction from conversation history for reference resolution
// Enables the AI to understand "itu", "tadi", "tsb" references

interface EntityContext {
  orderNumbers: string[];
  customerNames: string[];
  dates: { from: string; to: string } | null;
  lastTopic: string | null;
}

export function extractEntityContext(messages: { role: string; content: string }[]): EntityContext {
  const context: EntityContext = {
    orderNumbers: [],
    customerNames: [],
    dates: null,
    lastTopic: null,
  };

  // Only look at recent messages
  const recent = messages.slice(-10);
  const allText = recent.map((m) => m.content).join(" ");

  // Extract order numbers: CODE-YYYYMMDD-XXXX (any 2–5 letter tenant code).
  // Matches both new (HBL-...) and legacy (ORD-...) formats.
  const orderPattern = /[A-Z]{2,5}-\d{8}-\d{4}/g;
  const orders = allText.match(orderPattern);
  if (orders) {
    context.orderNumbers = [...new Set(orders)].slice(-5);
  }

  // Extract customer names from common patterns
  const customerPattern = /(?:pelanggan|customer|atas nama|nama)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g;
  const customerMatches = [...allText.matchAll(customerPattern)];
  if (customerMatches.length > 0) {
    context.customerNames = customerMatches.map((m) => m[1]).slice(-3);
  }

  // Extract date ranges
  const dateRangePattern = /(\d{4}-\d{2}-\d{2})\s*(?:s\/d|sampai|to)\s*(\d{4}-\d{2}-\d{2})/i;
  const dateMatch = dateRangePattern.exec(allText);
  if (dateMatch) {
    context.dates = { from: dateMatch[1], to: dateMatch[2] };
  }

  // Detect last topic from assistant messages
  const assistantMsgs = recent.filter((m) => m.role === "assistant");
  if (assistantMsgs.length > 0) {
    const lastAssistant = assistantMsgs[assistantMsgs.length - 1].content.toLowerCase();
    if (lastAssistant.includes("pendapatan") || lastAssistant.includes("revenue") || lastAssistant.includes("omset")) context.lastTopic = "revenue";
    else if (lastAssistant.includes("pesanan") || lastAssistant.includes("order")) context.lastTopic = "orders";
    else if (lastAssistant.includes("komisi") || lastAssistant.includes("commission")) context.lastTopic = "commission";
    else if (lastAssistant.includes("pelanggan") || lastAssistant.includes("customer")) context.lastTopic = "customers";
    else if (lastAssistant.includes("stok") || lastAssistant.includes("inventory")) context.lastTopic = "inventory";
    else if (lastAssistant.includes("laba") || lastAssistant.includes("profit")) context.lastTopic = "profit";
    else if (lastAssistant.includes("pengeluaran") || lastAssistant.includes("expense")) context.lastTopic = "expenses";
  }

  return context;
}

export function formatEntityContext(context: EntityContext): string {
  const parts: string[] = [];

  if (context.orderNumbers.length > 0) {
    parts.push(`- Pesanan yang disebutkan: ${context.orderNumbers.join(", ")}`);
  }
  if (context.customerNames.length > 0) {
    parts.push(`- Pelanggan yang disebutkan: ${context.customerNames.join(", ")}`);
  }
  if (context.dates) {
    parts.push(`- Periode yang disebutkan: ${context.dates.from} s/d ${context.dates.to}`);
  }
  if (context.lastTopic) {
    parts.push(`- Topik terakhir: ${context.lastTopic}`);
  }

  return parts.length > 0
    ? `\n## Konteks Percakapan\nSaat ini sedang membahas:\n${parts.join("\n")}\n\nGunakan konteks ini untuk memahami referensi seperti "itu", "tsb", "tadi", "order tersebut".`
    : "";
}
