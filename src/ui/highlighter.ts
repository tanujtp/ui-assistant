const PADDING = 6;

/**
 * Draws a pulsing ring around a live element and keeps it aligned through
 * scrolling, resizing and layout shifts. The ring ignores pointer events, so
 * the user can click the highlighted control directly.
 */
export class Highlighter {
  private target: Element | null = null;
  private frame = 0;

  constructor(
    private readonly ring: HTMLElement,
    private readonly onFrame?: (rect: DOMRect) => void,
  ) {
    this.ring.hidden = true;
  }

  show(element: Element): void {
    this.target = element;
    element.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
    this.ring.hidden = false;
    this.schedule();
  }

  hide(): void {
    this.target = null;
    this.ring.hidden = true;
    cancelAnimationFrame(this.frame);
  }

  private schedule = (): void => {
    this.position();
    if (this.target) this.frame = requestAnimationFrame(this.schedule);
  };

  private position(): void {
    const el = this.target;
    if (!el) return;
    if (!el.isConnected) {
      this.hide();
      return;
    }
    const r = el.getBoundingClientRect();
    this.onFrame?.(r);
    Object.assign(this.ring.style, {
      top: `${r.top - PADDING}px`,
      left: `${r.left - PADDING}px`,
      width: `${r.width + PADDING * 2}px`,
      height: `${r.height + PADDING * 2}px`,
    });
  }
}
