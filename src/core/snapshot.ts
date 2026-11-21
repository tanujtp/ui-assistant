import type { PageElement, PageSnapshot, SnapshotOptions } from "./types";

/** Attribute that hosts can add to exclude any subtree from the assistant. */
export const IGNORE_ATTRIBUTE = "data-uia-ignore";

const INTERACTIVE_SELECTOR = [
  "a[href]",
  "button",
  "input:not([type=hidden])",
  "select",
  "textarea",
  "summary",
  "[role=button]",
  "[role=link]",
  "[role=tab]",
  "[role=menuitem]",
  "[role=checkbox]",
  "[role=switch]",
  "[contenteditable=true]",
  "[data-uia-label]",
].join(",");

const MAX_LABEL = 80;
const DEFAULT_MAX_ELEMENTS = 80;

function clean(text: string | null | undefined): string {
  return (text ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_LABEL);
}

function labelFromReference(el: Element): string {
  const ids = el.getAttribute("aria-labelledby");
  if (!ids) return "";
  const doc = el.ownerDocument;
  return clean(
    ids
      .split(/\s+/)
      .map((id) => doc.getElementById(id)?.textContent ?? "")
      .join(" "),
  );
}

function labelFromLabelElement(el: Element): string {
  const id = el.getAttribute("id");
  if (id) {
    const forLabel = Array.from(el.ownerDocument.querySelectorAll("label[for]")).find(
      (label) => label.getAttribute("for") === id,
    );
    if (forLabel) return clean(forLabel.textContent);
  }
  return clean(el.closest("label")?.textContent);
}

/** Best human-readable name for an element, never including typed values. */
export function accessibleLabel(el: Element): string {
  return (
    clean(el.getAttribute("data-uia-label")) ||
    clean(el.getAttribute("aria-label")) ||
    labelFromReference(el) ||
    labelFromLabelElement(el) ||
    clean(el.textContent) ||
    clean(el.getAttribute("placeholder")) ||
    clean(el.getAttribute("title")) ||
    clean(el.getAttribute("alt")) ||
    clean(el.querySelector("img[alt]")?.getAttribute("alt")) ||
    clean(el.getAttribute("name"))
  );
}

function roleOf(el: Element): string {
  const explicit = el.getAttribute("role");
  if (explicit) return explicit;
  const tag = el.tagName.toLowerCase();
  if (tag === "a") return "link";
  if (tag === "select") return "combobox";
  if (tag === "textarea") return "textbox";
  if (tag === "input") {
    const type = (el.getAttribute("type") ?? "text").toLowerCase();
    if (type === "checkbox" || type === "radio") return type;
    if (type === "submit" || type === "button") return "button";
    return "textbox";
  }
  return tag;
}

function isHidden(el: Element, requireLayout: boolean): boolean {
  if (el.closest("[hidden],[aria-hidden=true]")) return true;
  const view = el.ownerDocument.defaultView;
  if (view) {
    const style = view.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return true;
  }
  return requireLayout && el.getClientRects().length === 0;
}

function isSensitive(el: Element): boolean {
  if (!(el instanceof HTMLInputElement)) return false;
  const type = el.type.toLowerCase();
  return type === "password" || el.autocomplete.startsWith("cc-");
}

/**
 * Builds a privacy-conscious, size-bounded description of what the user can
 * currently see and do. Typed values are never read; password and credit-card
 * fields are skipped entirely; `data-uia-ignore` subtrees are excluded.
 */
export function takeSnapshot(root: Document, options: SnapshotOptions = {}): PageSnapshot {
  const max = options.maxElements ?? DEFAULT_MAX_ELEMENTS;
  const requireLayout = options.requireLayout ?? true;
  const ignore = [`[${IGNORE_ATTRIBUTE}]`, options.ignoreSelector].filter(Boolean).join(",");

  const elements: PageElement[] = [];
  const nodes = new Map<string, Element>();

  for (const el of Array.from(root.querySelectorAll(INTERACTIVE_SELECTOR))) {
    if (elements.length >= max) break;
    if (ignore && el.closest(ignore)) continue;
    if (isHidden(el, requireLayout) || isSensitive(el)) continue;
    const label = accessibleLabel(el);
    if (!label) continue;

    const id = `e${elements.length + 1}`;
    const type = el instanceof HTMLInputElement ? el.type : undefined;
    elements.push({
      id,
      tag: el.tagName.toLowerCase(),
      role: roleOf(el),
      label,
      ...(type ? { type } : {}),
      disabled: el.matches(":disabled") || el.getAttribute("aria-disabled") === "true",
    });
    nodes.set(id, el);
  }

  const headings = Array.from(root.querySelectorAll("h1,h2,h3"))
    .filter((h) => !(ignore && h.closest(ignore)) && !isHidden(h, requireLayout))
    .map((h) => clean(h.textContent))
    .filter(Boolean)
    .slice(0, 12);

  return {
    url: root.location?.href ?? "",
    title: root.title,
    headings,
    elements,
    nodes,
  };
}
