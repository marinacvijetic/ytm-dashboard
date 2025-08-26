export class HttpError extends Error {
  status?: number;
  body?: unknown | string;
  url: string;
  method: string;
  constructor(msg: string, opts: {status?: number; body?: unknown | string; url: string; method: string}) {
    super(msg);
    this.name = "HttpError";
    this.status = opts.status;
    this.body = opts.body;
    this.url = opts.url;
    this.method = opts.method;
  }
}

export async function fetchJson<T>(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  const { timeoutMs = 10000, ...rest } = init;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);

  try {
    const resp = await fetch(url, { ...rest, signal: ctl.signal });

    const raw = await resp.text();
    const isJson = resp.headers.get("content-type")?.includes("application/json");
    const data = isJson ? (JSON.parse(raw) as unknown) : raw;

    if (!resp.ok) {
      const envelope = isJson && data && typeof data === "object" ? (data as any) : null;
      const message =
        envelope?.error?.message ||
        (typeof data === "string" ? data.slice(0, 200) : `HTTP ${resp.status}`);
      throw new HttpError(message, { status: resp.status, body: data, url, method: rest.method || "GET" });
    }

    return isJson ? (data as T) : (data as unknown as T);
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new HttpError("Request timed out", { url, method: rest.method || "GET" });
    }
    if (err instanceof TypeError && err.message.includes("Failed to fetch")) {
      throw new HttpError("Network error or CORS blocked the request", { url, method: rest.method || "GET" });
    }
    throw err;
  } finally {
    clearTimeout(t);
  }
}
