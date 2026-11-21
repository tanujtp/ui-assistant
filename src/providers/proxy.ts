import type { CompletionRequest, LLMProvider } from "../core/types";
import { ProviderError, postJson, type FetchLike } from "./http";

export interface ProxyOptions {
  /** Your backend endpoint. It holds the API key and forwards to the model. */
  url: string;
  headers?: Record<string, string>;
  fetch?: FetchLike;
}

/**
 * Recommended for production. Sends `{ system, messages }` to your endpoint and
 * expects `{ text: string }` back, so no secret ever reaches the browser.
 * See docs/proxy-server.md for a ready-to-copy implementation.
 */
export function createProxyProvider(options: ProxyOptions): LLMProvider {
  const fetchImpl = options.fetch ?? fetch.bind(globalThis);

  return {
    name: "proxy",
    async complete({ system, messages, signal }: CompletionRequest): Promise<string> {
      const data = (await postJson(
        fetchImpl,
        options.url,
        options.headers ?? {},
        { system, messages },
        signal,
      )) as { text?: unknown };
      if (typeof data.text !== "string") throw new ProviderError("Proxy response is missing `text`");
      return data.text;
    },
  };
}
