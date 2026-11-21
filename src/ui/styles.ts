export type Theme = "light" | "dark" | "auto";

/** Shadow-DOM scoped styles. Host pages cannot leak into, or be affected by, these. */
export const STYLES = /* css */ `
:host { all: initial; --uia-accent: #6d5efc; --uia-bg: #ffffff; --uia-fg: #14151a; --uia-muted: #6b7280;
  --uia-border: #e5e7eb; --uia-bubble: #f3f4f6; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
:host([data-theme="dark"]) { --uia-bg: #17181d; --uia-fg: #f3f4f6; --uia-muted: #9ca3af; --uia-border: #2b2d36; --uia-bubble: #23252d; }
@media (prefers-color-scheme: dark) {
  :host([data-theme="auto"]) { --uia-bg: #17181d; --uia-fg: #f3f4f6; --uia-muted: #9ca3af; --uia-border: #2b2d36; --uia-bubble: #23252d; }
}
* { box-sizing: border-box; }
button { font: inherit; cursor: pointer; }
:focus-visible { outline: 2px solid var(--uia-accent); outline-offset: 2px; }

.launcher { position: fixed; z-index: 2147483000; bottom: 20px; width: 56px; height: 56px; border-radius: 50%; border: 0;
  background: var(--uia-accent); color: #fff; box-shadow: 0 8px 24px rgba(0,0,0,.25); display: grid; place-items: center;
  transition: transform .15s ease; }
.launcher:hover { transform: scale(1.06); }
.launcher svg { width: 26px; height: 26px; }
.pos-right .launcher, .pos-right .panel { right: 20px; }
.pos-left .launcher, .pos-left .panel { left: 20px; }

.panel { position: fixed; z-index: 2147483000; bottom: 88px; width: min(380px, calc(100vw - 24px)); max-height: min(560px, calc(100vh - 110px));
  display: none; flex-direction: column; background: var(--uia-bg); color: var(--uia-fg); border: 1px solid var(--uia-border);
  border-radius: 16px; box-shadow: 0 20px 50px rgba(0,0,0,.28); overflow: hidden; }
.panel[data-open="true"] { display: flex; animation: pop .18s ease; }
@keyframes pop { from { opacity: 0; transform: translateY(8px) scale(.98); } }

header { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-bottom: 1px solid var(--uia-border); }
header .dot { width: 10px; height: 10px; border-radius: 50%; background: #22c55e; }
header h2 { margin: 0; font-size: 15px; font-weight: 600; flex: 1; }
header button { border: 0; background: none; color: var(--uia-muted); font-size: 20px; line-height: 1; border-radius: 6px; padding: 2px 6px; }

.log { flex: 1; overflow-y: auto; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; min-height: 140px; }
.msg { max-width: 88%; padding: 9px 12px; border-radius: 14px; font-size: 14px; line-height: 1.45; white-space: pre-wrap; overflow-wrap: anywhere; }
.msg.user { align-self: flex-end; background: var(--uia-accent); color: #fff; border-bottom-right-radius: 4px; }
.msg.assistant { align-self: flex-start; background: var(--uia-bubble); border-bottom-left-radius: 4px; }
.msg.error { align-self: flex-start; background: #fee2e2; color: #991b1b; }
.msg.pending { color: var(--uia-muted); font-style: italic; }

.chips { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 16px 10px; }
.chip { border: 1px solid var(--uia-border); background: var(--uia-bg); color: var(--uia-fg); padding: 6px 10px; border-radius: 999px; font-size: 12.5px; }
.chip:hover { border-color: var(--uia-accent); color: var(--uia-accent); }

.tour { margin: 0 16px 12px; padding: 12px; border-radius: 12px; border: 1px solid var(--uia-accent); background: color-mix(in srgb, var(--uia-accent) 8%, var(--uia-bg)); }
.tour[hidden] { display: none; }
.tour .count { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: var(--uia-accent); font-weight: 700; }
.tour h3 { margin: 4px 0; font-size: 14px; }
.tour p { margin: 0 0 10px; font-size: 13.5px; line-height: 1.45; }
.tour .controls { display: flex; gap: 8px; }
.tour .controls button { padding: 6px 12px; border-radius: 8px; border: 1px solid var(--uia-border); background: var(--uia-bg); color: var(--uia-fg); font-size: 13px; }
.tour .controls .primary { background: var(--uia-accent); border-color: var(--uia-accent); color: #fff; margin-left: auto; }
.tour .controls button:disabled { opacity: .45; cursor: default; }

form { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--uia-border); }
form input { flex: 1; min-width: 0; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--uia-border); background: var(--uia-bg); color: var(--uia-fg); font: inherit; font-size: 14px; }
form button { padding: 0 14px; border: 0; border-radius: 10px; background: var(--uia-accent); color: #fff; font-weight: 600; }
form button:disabled { opacity: .5; cursor: default; }

.ring { position: fixed; z-index: 2147482999; pointer-events: none; border-radius: 10px; border: 3px solid var(--uia-accent);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--uia-accent) 25%, transparent), 0 0 0 9999px rgba(10,10,20,.35);
  transition: top .2s ease, left .2s ease, width .2s ease, height .2s ease; animation: pulse 1.6s ease-in-out infinite; }
.ring[hidden] { display: none; }
@keyframes pulse { 50% { box-shadow: 0 0 0 9px color-mix(in srgb, var(--uia-accent) 15%, transparent), 0 0 0 9999px rgba(10,10,20,.35); } }

@media (prefers-reduced-motion: reduce) { .ring, .panel[data-open="true"], .launcher { animation: none; transition: none; } }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
`;
