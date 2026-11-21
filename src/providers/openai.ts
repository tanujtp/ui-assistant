import type { CompletionRequest, LLMProvider } from "../core/types";
import { ProviderError, postJson, trimSlash, type FetchLike } from "./http";

export interface OpenAICompatibleOptions {
  model: string;
  /** Omit for local servers such as Ollama that need no key. */
  apiKey?: string;
  /** Defaults to OpenAI. Use `http://localhost:11434/v1` for Ollama. */
  baseUrl?: string;
  maxTokens?: number;
  fetch?: FetchLike;
}

/** Works with OpenAI, Ollama, OpenRouter, vLLM, LM Studio, and any `/chat/completions` API. */
export function createOpenAICompatibleProvider(options: OpenAICompatibleOptions): LLMProvider {
  const fetchImpl = options.fetch ?? fetch.bind(globalThis);
  const base = trimSlash(options.baseUrl ?? "https://api.openai.com/v1");

  return {
    name: "openai-compatible",
    async complete({ system, messages, signal }: CompletionRequest): Promise<string> {
      const data = (await postJson(
        fetchImpl,
        `${base}/chat/completions`,
        options.apiKey ? { authorization: `Bearer ${options.apiKey}` } : {},
        {
          model: options.model,
          max_tokens: options.maxTokens ?? 1024,
          messages: [{ role: "system", content: system }, ...messages],
        },
        signal,
      )) as { choices?: Array<{ message?: { content?: string } }> };

      const text = data.choices?.[0]?.message?.content;
      if (typeof text !== "string") throw new ProviderError("Unexpected response from provider");
      return text;
    },
  };
}
