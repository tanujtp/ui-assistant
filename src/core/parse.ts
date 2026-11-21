import type { AssistantAnswer, GuideStep } from "./types";

export const MAX_STEPS = 8;
const MAX_TEXT = 400;

function clip(value: unknown, max = MAX_TEXT): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** Returns the first balanced top-level `{...}` block, ignoring braces in strings. */
export function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return text.slice(start, i + 1);
  }
  return null;
}

function toStep(raw: unknown): GuideStep | null {
  if (typeof raw !== "object" || raw === null) return null;
  const record = raw as Record<string, unknown>;
  const instruction = clip(record["instruction"]);
  if (!instruction) return null;
  const target = clip(record["target"], 200);
  return {
    title: clip(record["title"], 80) || "Next step",
    instruction,
    ...(target ? { target } : {}),
  };
}

/**
 * Parses a model reply into a validated answer. Never throws: malformed output
 * degrades to a plain-text message so the user still gets a response.
 */
export function parseAnswer(text: string): AssistantAnswer {
  const json = extractJsonObject(text);
  if (json) {
    try {
      const data: unknown = JSON.parse(json);
      if (typeof data === "object" && data !== null) {
        const record = data as Record<string, unknown>;
        const message = clip(record["message"], 1000);
        const steps = (Array.isArray(record["steps"]) ? record["steps"] : [])
          .map(toStep)
          .filter((s): s is GuideStep => s !== null)
          .slice(0, MAX_STEPS);
        if (message || steps.length) return { message, steps };
      }
    } catch {
      /* fall through to plain text */
    }
  }
  return { message: clip(text, 1000) || "Sorry, I couldn't come up with an answer.", steps: [] };
}
