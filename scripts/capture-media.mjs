// Regenerates README screenshots and the demo GIF.
// Usage: npm run dev (in another shell), then `npm run media`.
// Requires Google Chrome and ffmpeg on PATH.
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const DEMO_URL = process.env.DEMO_URL ?? "http://localhost:5173/";
const OUT = fileURLToPath(new URL("../docs/assets/", import.meta.url));
mkdirSync(OUT, { recursive: true });
const frames = mkdtempSync(join(tmpdir(), "uia-frames-"));

const browser = await chromium.launch({ channel: "chrome" });

async function newPage(colorScheme = "light") {
  const context = await browser.newContext({ viewport: { width: 1280, height: 760 }, colorScheme, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(DEMO_URL);
  await page.waitForTimeout(400);
  return page;
}

// ---- GIF recording ----------------------------------------------------------
const page = await newPage();
let n = 0;
const snap = async (count = 1, gap = 90) => {
  for (let i = 0; i < count; i++) {
    await page.screenshot({ path: join(frames, `f${String(n++).padStart(4, "0")}.png`) });
    await page.waitForTimeout(gap);
  }
};

await snap(8);
await page.locator(".launcher").click();
await snap(8);

const question = "How do I invite a teammate?";
for (const ch of question) {
  await page.locator("input[aria-label=\"Your question\"]").pressSequentially(ch);
  await snap(1, 25);
}
await snap(5);
await page.locator("input[aria-label=\"Your question\"]").press("Enter");
await page.waitForTimeout(700);
await snap(16);
await page.screenshot({ path: join(OUT, "step-highlight.png") });

for (let i = 0; i < 2; i++) {
  await page.locator(".tour .primary").click();
  await page.waitForTimeout(500);
  await snap(14);
}
await page.locator(".tour .primary").click();
await snap(8);

execFileSync("ffmpeg", [
  "-y", "-loglevel", "error", "-framerate", "10", "-i", join(frames, "f%04d.png"),
  "-vf", "fps=10,scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4",
  join(OUT, "demo.gif"),
]);

// ---- Stills -------------------------------------------------------------------
const still = await newPage();
await still.screenshot({ path: join(OUT, "app-without-assistant.png") });
await still.locator(".launcher").click();
await still.locator("input[aria-label=\"Your question\"]").fill("How do I create a project?");
await still.locator("input[aria-label=\"Your question\"]").press("Enter");
await still.waitForTimeout(1000);
await still.screenshot({ path: join(OUT, "project-answer.png") });
await still.context().close();

const guide = await newPage();
await guide.locator(".launcher").click();
await guide.locator(".chip", { hasText: "Quick tour" }).click();
await guide.waitForTimeout(900);
await guide.screenshot({ path: join(OUT, "guided-tour.png") });
await guide.context().close();

const dark = await newPage("dark");
await dark.locator(".launcher").click();
await dark.locator(".chip", { hasText: "billing" }).click();
await dark.waitForTimeout(1000);
await dark.screenshot({ path: join(OUT, "dark-mode.png") });

await browser.close();
rmSync(frames, { recursive: true, force: true });
console.log("Media written to docs/assets/");
