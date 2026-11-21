/** A single instruction shown to the user, optionally anchored to an element. */
export interface GuideStep {
  /**
   * Element to highlight. Either an element id from the page snapshot
   * (e.g. `e12`) or a CSS selector. Omit for a purely textual step.
   */
  target?: string;
  title: string;
  instruction: string;
}

/** Structured response produced by an assistant turn. */
export interface AssistantAnswer {
  message: string;
  steps: GuideStep[];
}

/** A pre-authored, deterministic walkthrough that needs no LLM. */
export interface Guide {
  id: string;
  title: string;
  description?: string;
  steps: GuideStep[];
}

/** A chunk of product knowledge injected into the model prompt. */
export interface KnowledgeEntry {
  title: string;
  content: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CompletionRequest {
  system: string;
  messages: ChatMessage[];
  signal?: AbortSignal;
}

/**
 * Anything that can turn a prompt into text. Implement this to plug in any
 * model or backend; the library ships adapters for Anthropic, OpenAI-compatible
 * APIs (incl. Ollama), your own proxy endpoint, and a scripted offline provider.
 */
export interface LLMProvider {
  readonly name: string;
  complete(request: CompletionRequest): Promise<string>;
}

/** Lightweight description of one interactive element on the page. */
export interface PageElement {
  id: string;
  tag: string;
  role: string;
  label: string;
  type?: string;
  disabled: boolean;
}

export interface PageSnapshot {
  url: string;
  title: string;
  headings: string[];
  elements: PageElement[];
  /** id -> live DOM node. Never serialized or sent to the model. */
  nodes: ReadonlyMap<string, Element>;
}

export interface ResolvedStep extends GuideStep {
  element: Element | null;
}

export interface ResolvedAnswer {
  message: string;
  steps: ResolvedStep[];
}

export interface SnapshotOptions {
  /** Maximum interactive elements included. Default 80. */
  maxElements?: number;
  /** Skip elements with no layout box. Disable only in non-layout test DOMs. */
  requireLayout?: boolean;
  /** Elements matching this selector (and their subtrees) are never read. */
  ignoreSelector?: string;
}
