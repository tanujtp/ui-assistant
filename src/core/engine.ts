import { parseAnswer } from "./parse";
import { buildSystemPrompt, type PromptOptions } from "./prompt";
import { IGNORE_ATTRIBUTE, takeSnapshot } from "./snapshot";
import type {
  ChatMessage,
  GuideStep,
  LLMProvider,
  PageSnapshot,
  ResolvedAnswer,
  ResolvedStep,
  SnapshotOptions,
} from "./types";

export interface EngineOptions extends PromptOptions {
  provider: LLMProvider;
  snapshot?: SnapshotOptions;
  /** Past messages kept as conversation context. Default 10. */
  maxHistory?: number;
  document?: Document;
}

/** Finds the live element for a step target (snapshot id first, then CSS selector). */
export function resolveTarget(
  target: string | undefined,
  snapshot: PageSnapshot,
  doc: Document,
): Element | null {
  if (!target) return null;
  const byId = snapshot.nodes.get(target);
  if (byId) return byId;
  try {
    const el = doc.querySelector(target);
    return el && !el.closest(`[${IGNORE_ATTRIBUTE}]`) ? el : null;
  } catch {
    return null; // invalid selector from the model
  }
}

export function resolveSteps(steps: GuideStep[], snapshot: PageSnapshot, doc: Document): ResolvedStep[] {
  return steps.map((step) => ({ ...step, element: resolveTarget(step.target, snapshot, doc) }));
}

/** Framework-free core: question in, validated and DOM-resolved guidance out. */
export class AssistantEngine {
  private readonly history: ChatMessage[] = [];
  private readonly doc: Document;
  private readonly maxHistory: number;

  constructor(private readonly options: EngineOptions) {
    this.doc = options.document ?? document;
    this.maxHistory = options.maxHistory ?? 10;
  }

  async ask(question: string, signal?: AbortSignal): Promise<ResolvedAnswer> {
    const snapshot = takeSnapshot(this.doc, this.options.snapshot);
    const userMessage: ChatMessage = { role: "user", content: question };

    const raw = await this.options.provider.complete({
      system: buildSystemPrompt(snapshot, this.options),
      messages: [...this.history, userMessage],
      ...(signal ? { signal } : {}),
    });

    const answer = parseAnswer(raw);
    this.remember(userMessage, { role: "assistant", content: answer.message });
    return { message: answer.message, steps: resolveSteps(answer.steps, snapshot, this.doc) };
  }

  reset(): void {
    this.history.length = 0;
  }

  private remember(...messages: ChatMessage[]): void {
    this.history.push(...messages);
    const overflow = this.history.length - this.maxHistory;
    if (overflow > 0) this.history.splice(0, overflow);
  }
}
