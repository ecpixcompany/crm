export class N8nWebhookError extends Error {
  status: number;
  body: string;
  constructor(status: number, body: string) {
    super(`N8n webhook ${status}: ${body || "error"}`);
    this.name = "N8nWebhookError";
    this.status = status;
    this.body = body;
  }
}

export async function sendWhatsappManual(input: {
  numero: string;
  texto: string;
  leadDocumentId?: string;
  conversacionDocumentId?: string;
}): Promise<unknown> {
  const url = import.meta.env.VITE_N8N_WSP_WEBHOOK;
  if (!url) {
    throw new Error("VITE_N8N_WSP_WEBHOOK no esta definido");
  }
  const timeoutMs = Number(import.meta.env.VITE_N8N_WSP_TIMEOUT_MS ?? 15000);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new N8nWebhookError(res.status, body);
  }
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
