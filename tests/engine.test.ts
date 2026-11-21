import { beforeEach, describe, expect, it, vi } from "vitest";
import { AssistantEngine, resolveTarget } from "../src/core/engine";
import { buildSystemPrompt } from "../src/core/prompt";
import { takeSnapshot } from "../src/core/snapshot";
import type { CompletionRequest, LLMProvider } from "../src/core/types";

const snapshot = { requireLayout: false };

function providerReturning(text: string) {
  const complete = vi.fn<(req: CompletionRequest) => Promise<string>>(async () => text);
  const provider: LLMProvider = { name: "test", complete };
  return { provider, complete };
}

describe("AssistantEngine", () => {
  beforeEach(() => {
    document.body.innerHTML = `<button id="a">Create project</button><button id="b">Invite</button>`;
  });

  it("resolves model targets to live elements", async () => {
    const { provider } = providerReturning(
      JSON.stringify({ message: "ok", steps: [{ target: "e2", title: "Invite", instruction: "Click Invite" }] }),
    );
    const engine = new AssistantEngine({ provider, productName: "Acme", snapshot });
    const answer = await engine.ask("how do I invite someone?");
    expect(answer.steps[0]?.element?.id).toBe("b");
  });

  it("returns null for hallucinated ids and invalid selectors instead of throwing", async () => {
    const { provider } = providerReturning(
      JSON.stringify({
        message: "ok",
        steps: [
          { target: "e99", title: "x", instruction: "x" },
          { target: "###", title: "y", instruction: "y" },
        ],
      }),
    );
    const engine = new AssistantEngine({ provider, productName: "Acme", snapshot });
    const answer = await engine.ask("?");
    expect(answer.steps.map((s) => s.element)).toEqual([null, null]);
  });

  it("keeps bounded conversation history", async () => {
    const { provider, complete } = providerReturning('{"message":"hi","steps":[]}');
    const engine = new AssistantEngine({ provider, productName: "Acme", snapshot, maxHistory: 2 });
    await engine.ask("one");
    await engine.ask("two");
    await engine.ask("three");
    const last = complete.mock.calls[2]?.[0];
    expect(last?.messages.map((m) => m.content)).toEqual(["two", "hi", "three"]);
  });
});

describe("resolveTarget", () => {
  it("does not resolve into ignored subtrees", () => {
    document.body.innerHTML = `<div data-uia-ignore><button id="x">X</button></div>`;
    const snap = takeSnapshot(document, snapshot);
    expect(resolveTarget("#x", snap, document)).toBeNull();
  });
});

describe("buildSystemPrompt", () => {
  it("frames page data as untrusted and omits DOM values", () => {
    document.body.innerHTML = `<input aria-label="Name" value="private" />`;
    const prompt = buildSystemPrompt(takeSnapshot(document, snapshot), {
      productName: "Acme",
      knowledge: "Docs here",
    });
    expect(prompt).toContain("untrusted data");
    expect(prompt).toContain("Docs here");
    expect(prompt).not.toContain("private");
  });
});
