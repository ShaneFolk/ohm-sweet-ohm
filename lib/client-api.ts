// Browser-side helper for calling our own API routes with JSON.
// Always resolves (never throws), so forms only need to check `ok`.

export type ApiResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; error: string; fields?: Record<string, string[]> };

export async function apiSend(url: string, method: string, body?: unknown): Promise<ApiResult> {
  try {
    const res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true, data };

    // 500s get a generic message; everything else has a useful one from the API.
    const error =
      res.status === 401
        ? "Your session expired. Please log in again."
        : res.status >= 500 || !data.error
          ? "Something went wrong. Please try again."
          : String(data.error);
    return { ok: false, error, fields: data.fields };
  } catch {
    return { ok: false, error: "Couldn't reach the server. Please try again." };
  }
}
