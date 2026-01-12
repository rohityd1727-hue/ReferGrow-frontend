const rawBase = process.env.NEXT_PUBLIC_API_BASE_URL;

function normalizeBase(base: string) {
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

export function apiUrl(path: string) {
  // In the browser we prefer same-origin calls (Next.js API proxy) so httpOnly cookies
  // are set on the frontend domain. On the server, allow an explicit base.
  const base = typeof window === "undefined" && rawBase ? normalizeBase(rawBase) : "";
  if (!base) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export function apiFetch(input: string, init: RequestInit = {}) {
  const url = apiUrl(input);
  const credentials = init.credentials ?? "include";
  return fetch(url, { ...init, credentials });
}

type ParsedBody = {
  text: string | null;
  json: unknown | null;
};

function looksLikeJson(contentType: string | null, text: string) {
  const ct = (contentType ?? "").toLowerCase();
  if (ct.includes("application/json") || ct.includes("+json")) return true;
  const trimmed = text.trimStart();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
}

export async function readBody(res: Response): Promise<ParsedBody> {
  // Important: body can only be consumed once.
  let text = "";
  try {
    text = await res.text();
  } catch {
    text = "";
  }

  if (!text) return { text: null, json: null };

  if (!looksLikeJson(res.headers.get("content-type"), text)) {
    return { text, json: null };
  }

  try {
    return { text, json: JSON.parse(text) as unknown };
  } catch {
    return { text, json: null };
  }
}

export function responseErrorMessage(res: Response, body: ParsedBody) {
  const json = body.json as { error?: unknown; message?: unknown } | null;
  const fromJson =
    typeof json?.error === "string"
      ? json.error
      : typeof json?.message === "string"
        ? json.message
        : null;

  const fromText = body.text ? body.text.trim() : null;
  return fromJson ?? fromText ?? `Request failed (${res.status})`;
}
