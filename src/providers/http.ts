export class ProviderError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export type FetchLike = typeof fetch;

/** POSTs JSON and returns the parsed body, converting failures into ProviderError. */
export async function postJson(
  fetchImpl: FetchLike,
  url: string,
  headers: Record<string, string>,
  body: unknown,
  signal?: AbortSignal,
): Promise<unknown> {
  const response = await fetchImpl(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
    ...(signal ? { signal } : {}),
  });
  if (!response.ok) {
    // Deliberately omit the response body: it may echo request content.
    throw new ProviderError(`Provider request failed (${response.status})`, response.status);
  }
  return response.json();
}

export function trimSlash(url: string): string {
  return url.replace(/\/+$/, "");
}
