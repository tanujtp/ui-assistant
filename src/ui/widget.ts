import { AssistantEngine, resolveSteps } from "../core/engine";
import { IGNORE_ATTRIBUTE, takeSnapshot } from "../core/snapshot";
import type {
  Guide,
  KnowledgeEntry,
  LLMProvider,
  ResolvedStep,
  SnapshotOptions,
} from "../core/types";
import { Highlighter } from "./highlighter";
import { STYLES, type Theme } from "./styles";

export interface AssistantConfig {
  provider: LLMProvider;
  productName: string;
  /** Product documentation the model may draw on. */
  knowledge?: string | KnowledgeEntry[];
  /** Pre-authored walkthroughs the user can start without calling the model. */
  guides?: Guide[];
  /** Quick-start questions shown as chips. */
  suggestions?: string[];
  title?: string;
  placeholder?: string;
  welcome?: string;
  position?: "right" | "left";
  theme?: Theme;
  /** Any CSS color. */
  accentColor?: string;
  snapshot?: SnapshotOptions;
  extraInstructions?: string;
  onError?: (error: unknown) => void;
  /** Mount point; defaults to `document.body`. */
  container?: HTMLElement;
}

export interface AssistantHandle {
  open(): void;
  close(): void;
  ask(question: string): Promise<void>;
  startGuide(id: string): boolean;
  destroy(): void;
}

const ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M9 9h.01M13 9h.01M17 9h.01"/></svg>`;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> & { className?: string } = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

/** Mounts the floating assistant. Returns a handle for programmatic control. */
export function createAssistant(config: AssistantConfig): AssistantHandle {
  const engine = new AssistantEngine({
    provider: config.provider,
    productName: config.productName,
    ...(config.knowledge ? { knowledge: config.knowledge } : {}),
    ...(config.extraInstructions ? { extraInstructions: config.extraInstructions } : {}),
    snapshot: config.snapshot ?? {},
  });
  const guides = new Map((config.guides ?? []).map((g) => [g.id, g]));
  const title = config.title ?? `${config.productName} Assistant`;

  // ---- DOM (inside a shadow root so host CSS can't interfere) -------------
  const host = el("div");
  host.setAttribute(IGNORE_ATTRIBUTE, "");
  host.dataset["theme"] = config.theme ?? "auto";
  if (config.accentColor) host.style.setProperty("--uia-accent", config.accentColor);
  const root = host.attachShadow({ mode: "open" });

  const ring = el("div", { className: "ring" });
  const log = el("div", { className: "log" });
  log.setAttribute("role", "log");
  log.setAttribute("aria-live", "polite");
  const input = el("input", {
    type: "text",
    placeholder: config.placeholder ?? "Ask how to do something…",
    maxLength: 500,
  });
  input.setAttribute("aria-label", "Your question");
  input.autocomplete = "off";
  const send = el("button", { type: "submit" }, "Ask");
  const form = el("form", {}, input, send);

  const tourCount = el("div", { className: "count" });
  const tourTitle = el("h3");
  const tourBody = el("p");
  const prev = el("button", { type: "button" }, "Back");
  const next = el("button", { type: "button", className: "primary" }, "Next");
  const end = el("button", { type: "button" }, "End");
  const tour = el("section", { className: "tour", hidden: true }, tourCount, tourTitle, tourBody, el("div", { className: "controls" }, prev, end, next));
  tour.setAttribute("aria-label", "Current step");

  const closeBtn = el("button", { type: "button", ariaLabel: "Close assistant" }, "×");
  const header = el("header", {}, el("span", { className: "dot" }), el("h2", {}, title), closeBtn);
  const chips = el("div", { className: "chips" });
  const panel = el("div", { className: "panel" }, header, log, chips, tour, form);
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", title);
  panel.dataset["open"] = "false";

  const launcher = el("button", { type: "button", className: "launcher", ariaLabel: `Open ${title}` });
  launcher.innerHTML = ICON; // static, trusted constant

  const shell = el("div", { className: `pos-${config.position ?? "right"}` }, ring, panel, launcher);
  root.append(el("style", {}, STYLES), shell);
  (config.container ?? document.body).append(host);

  // Keep the highlighted control visible: if the open panel covers it, move the
  // panel to the other side of the screen (at most once per step to avoid flicker).
  let flipped = false;
  const avoidOverlap = (target: DOMRect): void => {
    if (flipped || panel.dataset["open"] !== "true") return;
    const p = panel.getBoundingClientRect();
    const overlaps = target.left < p.right && target.right > p.left && target.top < p.bottom && target.bottom > p.top;
    if (!overlaps) return;
    flipped = true;
    shell.classList.toggle("pos-right");
    shell.classList.toggle("pos-left");
  };
  const highlighter = new Highlighter(ring, avoidOverlap);

  // ---- State ---------------------------------------------------------------
  let steps: ResolvedStep[] = [];
  let index = 0;
  let controller: AbortController | null = null;

  const say = (role: "user" | "assistant" | "error" | "pending", text: string): HTMLElement => {
    const node = el("div", { className: `msg ${role}` }, text); // textContent only: no HTML injection
    log.append(node);
    log.scrollTop = log.scrollHeight;
    return node;
  };

  const renderStep = (): void => {
    const step = steps[index];
    if (!step) return;
    tour.hidden = false;
    tourCount.textContent = `Step ${index + 1} of ${steps.length}`;
    tourTitle.textContent = step.title;
    tourBody.textContent = step.instruction;
    prev.disabled = index === 0;
    next.textContent = index === steps.length - 1 ? "Done" : "Next";
    flipped = false;
    if (step.element?.isConnected) highlighter.show(step.element);
    else highlighter.hide();
  };

  const endTour = (): void => {
    steps = [];
    index = 0;
    tour.hidden = true;
    highlighter.hide();
  };

  const beginTour = (newSteps: ResolvedStep[]): void => {
    steps = newSteps;
    index = 0;
    if (steps.length) renderStep();
    else endTour();
  };

  const open = (): void => {
    panel.dataset["open"] = "true";
    launcher.setAttribute("aria-expanded", "true");
    input.focus();
  };
  const close = (): void => {
    panel.dataset["open"] = "false";
    launcher.setAttribute("aria-expanded", "false");
    launcher.focus();
  };

  const ask = async (question: string): Promise<void> => {
    const text = question.trim();
    if (!text) return;
    open();
    endTour();
    say("user", text);
    const pending = say("pending", "Thinking…");
    send.disabled = true;
    controller?.abort();
    controller = new AbortController();
    try {
      const answer = await engine.ask(text, controller.signal);
      pending.remove();
      if (answer.message) say("assistant", answer.message);
      beginTour(answer.steps);
    } catch (error) {
      pending.remove();
      if ((error as { name?: string }).name === "AbortError") return;
      say("error", "Sorry, something went wrong. Please try again.");
      config.onError?.(error);
    } finally {
      send.disabled = false;
    }
  };

  const startGuide = (id: string): boolean => {
    const guide = guides.get(id);
    if (!guide) return false;
    open();
    endTour();
    say("assistant", guide.description ?? `Let's walk through: ${guide.title}.`);
    const snapshot = takeSnapshot(document, config.snapshot);
    beginTour(resolveSteps(guide.steps, snapshot, document));
    return true;
  };

  // ---- Wiring --------------------------------------------------------------
  const onSubmit = (event: Event): void => {
    event.preventDefault();
    const value = input.value;
    input.value = "";
    void ask(value);
  };
  const onKeydown = (event: KeyboardEvent): void => {
    if (event.key === "Escape" && panel.dataset["open"] === "true") close();
  };

  form.addEventListener("submit", onSubmit);
  launcher.addEventListener("click", () => (panel.dataset["open"] === "true" ? close() : open()));
  closeBtn.addEventListener("click", close);
  prev.addEventListener("click", () => {
    index = Math.max(0, index - 1);
    renderStep();
  });
  next.addEventListener("click", () => {
    if (index >= steps.length - 1) endTour();
    else {
      index += 1;
      renderStep();
    }
  });
  end.addEventListener("click", endTour);
  document.addEventListener("keydown", onKeydown);

  say("assistant", config.welcome ?? `Hi! I can show you around ${config.productName}. What would you like to do?`);
  for (const text of config.suggestions ?? []) {
    chips.append(el("button", { type: "button", className: "chip" }, text));
  }
  for (const guide of guides.values()) {
    chips.append(el("button", { type: "button", className: "chip" }, `▶ ${guide.title}`));
  }
  chips.addEventListener("click", (event) => {
    const chip = (event.target as HTMLElement).closest<HTMLButtonElement>(".chip");
    if (!chip) return;
    const label = chip.textContent ?? "";
    const guide = [...guides.values()].find((g) => `▶ ${g.title}` === label);
    if (guide) startGuide(guide.id);
    else void ask(label);
  });

  return {
    open,
    close,
    ask,
    startGuide,
    destroy(): void {
      controller?.abort();
      highlighter.hide();
      document.removeEventListener("keydown", onKeydown);
      host.remove();
    },
  };
}
