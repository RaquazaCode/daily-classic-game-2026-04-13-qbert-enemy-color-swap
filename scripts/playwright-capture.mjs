import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const artifactsDir = join(root, "artifacts", "playwright");
mkdirSync(artifactsDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();

await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
await page.waitForTimeout(300);

await page.screenshot({ path: join(artifactsDir, "screen-start.png") });

const frameSets = [
  {
    name: "clip-01-opening",
    setup: async () => {
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(120);
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(120);
    }
  },
  {
    name: "clip-02-enemy-pressure",
    setup: async () => {
      await page.evaluate(() => window.advanceTime(2400));
      await page.waitForTimeout(150);
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(120);
      await page.keyboard.press("ArrowLeft");
      await page.waitForTimeout(120);
    }
  },
  {
    name: "clip-03-recovery-route",
    setup: async () => {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(120);
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(120);
      await page.keyboard.press("ArrowLeft");
      await page.waitForTimeout(120);
    }
  }
];

for (const frameSet of frameSets) {
  const framesDir = join(artifactsDir, `${frameSet.name}-frames`);
  mkdirSync(framesDir, { recursive: true });
  await frameSet.setup();
  for (let i = 0; i < 20; i += 1) {
    await page.screenshot({ path: join(framesDir, `${String(i).padStart(3, "0")}.png`) });
    await page.waitForTimeout(60);
  }
  execSync(
    `ffmpeg -y -hide_banner -loglevel error -framerate 12 -i "${framesDir}/%03d.png" -vf "fps=12,scale=960:-1:flags=lanczos" "${artifactsDir}/${frameSet.name}.gif"`
  );
}

const textDump = await page.evaluate(() => window.render_game_to_text());
await page.screenshot({ path: join(artifactsDir, "screen-final.png") });

console.log("playwright text snapshot:\n" + textDump);
await browser.close();
