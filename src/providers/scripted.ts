import type { AssistantAnswer, LLMProvider } from "../core/types";

export interface ScriptedRule {
  /** Matched against the latest user message. */
  match: RegExp;
  answer: AssistantAnswer;
}

/**
 * Offline provider that replies from a list of rules. Great for demos, tests,
 * and as a free first line of defence for your most common questions.
 */
export function createScriptedProvider(
  rules: ScriptedRule[],
  fallback: AssistantAnswer = {
    message: "I'm not sure about that yet. Try asking about a specific feature.",
    steps: [],
  },
): LLMProvider {
  return {
    name: "scripted",
    async complete({ messages }) {
      const question = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
      const rule = rules.find((r) => r.match.test(question));
      return JSON.stringify(rule?.answer ?? fallback);
    },
  };
}
