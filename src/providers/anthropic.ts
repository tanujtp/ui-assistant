import type { CompletionRequest, LLMProvider } from "../core/types";
import { ProviderError, postJson, trimSlash, type FetchLike } from "./http";

export interface AnthropicOptions {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  maxTokens?: number;
  fetch?: FetchLike;
}

/**
 * Calls the Anthropic Messages API directly from the browser.
 * Fine for demos and local development. In production, keep the key on a
 * server and use `createProxyProvider` instead.
 */
export function createAnthropicProvider(options: AnthropicOptions): LLMProvider {
  const fetchImpl = options.fetch ?? fetch.bind(globalThis);
  const base = trimSlash(options.baseUrl ?? "https://api.anthropic.com");

  return {
    name: "anthropic",
    async complete({ system, messages, signal }: CompletionRequest): Promise<string> {
      const data = (await postJson(
        fetchImpl,
        `${base}/v1/messages`,
        {
          "x-api-key": options.apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        {
          model: options.model ?? "claude-sonnet-5-5",
          max_tokens: options.maxTokens ?? 1024,
          system,
          messages,
        },
        signal,
      )) as { content?: Array<{ type: string; text?: string }> };

      const text = data.content?.find((block) => block.type === "text")?.text;
      if (typeof text !== "string") throw new ProviderError("Unexpected response from Anthropic");
      return text;
    },
  };
}
