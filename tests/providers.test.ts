import { describe, expect, it, vi } from "vitest";
import { createAnthropicProvider } from "../src/providers/anthropic";
import { ProviderError } from "../src/providers/http";
import { createOpenAICompatibleProvider } from "../src/providers/openai";
import { createProxyProvider } from "../src/providers/proxy";
import { createScriptedProvider } from "../src/providers/scripted";

const req = { system: "sys", messages: [{ role: "user" as const, content: "hi" }] };

function fakeFetch(body: unknown, status = 200) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status }));
}

describe("providers", () => {
  it("anthropic: sends system + messages and extracts text", async () => {
    const fetch = fakeFetch({ content: [{ type: "text", text: "hello" }] });
    const text = await createAnthropicProvider({ apiKey: "k", fetch }).complete(req);
    expect(text).toBe("hello");
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    expect(JSON.parse(init.body as string)).toMatchObject({ system: "sys", messages: req.messages });
  });

  it("openai-compatible: prepends system message, no auth header without key", async () => {
    const fetch = fakeFetch({ choices: [{ message: { content: "yo" } }] });
    const text = await createOpenAICompatibleProvider({
      model: "llama3",
      baseUrl: "http://localhost:11434/v1/",
      fetch,
    }).complete(req);
    expect(text).toBe("yo");
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://localhost:11434/v1/chat/completions");
    expect((init.headers as Record<string, string>)["authorization"]).toBeUndefined();
    expect(JSON.parse(init.body as string).messages[0]).toEqual({ role: "system", content: "sys" });
  });

  it("proxy: returns text from your backend", async () => {
    const text = await createProxyProvider({ url: "/api/assist", fetch: fakeFetch({ text: "ok" }) }).complete(req);
    expect(text).toBe("ok");
  });

  it("raises ProviderError without leaking the response body", async () => {
    const provider = createProxyProvider({ url: "/x", fetch: fakeFetch({ error: "echoed secret" }, 500) });
    await expect(provider.complete(req)).rejects.toThrow(ProviderError);
    await expect(provider.complete(req)).rejects.not.toThrow(/echoed secret/);
  });

  it("scripted: matches rules and falls back", async () => {
    const provider = createScriptedProvider([{ match: /invite/i, answer: { message: "Invite!", steps: [] } }]);
    expect(JSON.parse(await provider.complete(req)).message).toMatch(/not sure/);
    const hit = await provider.complete({ ...req, messages: [{ role: "user", content: "how to invite" }] });
    expect(JSON.parse(hit).message).toBe("Invite!");
  });
});
