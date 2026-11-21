import { beforeEach, describe, expect, it } from "vitest";
import { takeSnapshot } from "../src/core/snapshot";

const opts = { requireLayout: false };

describe("takeSnapshot", () => {
  beforeEach(() => {
    document.title = "Billing";
    document.body.innerHTML = `
      <h1>Billing settings</h1>
      <button id="save">Save changes</button>
      <label for="email">Work email</label><input id="email" value="secret@example.com" />
      <input type="password" aria-label="Password" />
      <input autocomplete="cc-number" aria-label="Card" />
      <button hidden>Hidden</button>
      <button style="display:none">Invisible</button>
      <div data-uia-ignore><button>Ignored</button></div>
      <button aria-label="Close"><svg></svg></button>
      <button disabled>Upgrade</button>
    `;
  });

  it("lists visible, labelled, non-sensitive controls", () => {
    const snap = takeSnapshot(document, opts);
    const labels = snap.elements.map((e) => e.label);
    expect(labels).toEqual(["Save changes", "Work email", "Close", "Upgrade"]);
    expect(snap.headings).toEqual(["Billing settings"]);
    expect(snap.title).toBe("Billing");
  });

  it("never exposes typed values", () => {
    const serialized = JSON.stringify(takeSnapshot(document, opts).elements);
    expect(serialized).not.toContain("secret@example.com");
  });

  it("maps ids to live nodes and flags disabled controls", () => {
    const snap = takeSnapshot(document, opts);
    expect(snap.nodes.get("e1")?.id).toBe("save");
    expect(snap.elements.find((e) => e.label === "Upgrade")?.disabled).toBe(true);
  });

  it("respects maxElements", () => {
    expect(takeSnapshot(document, { ...opts, maxElements: 2 }).elements).toHaveLength(2);
  });
});
