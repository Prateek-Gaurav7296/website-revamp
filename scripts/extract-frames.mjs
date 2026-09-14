/**
 * Pull frames out of a video using headless Chromium.
 *
 *   node scripts/extract-frames.mjs <urlPath> <outDir> [t0] [t1] [count] [scale]
 *
 * There is no ffmpeg on this machine, and Playwright is already a dependency,
 * so frame extraction goes through a real browser: load the video, seek, draw
 * to a canvas, read the pixels back.
 *
 * `urlPath` is served by the dev server (e.g. /character/candidate.mp4), because
 * a page at about:blank cannot read file:// media.
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const [urlPath, outDir, t0 = 0, t1 = 0, count = 16, scale = 1] = process.argv.slice(2);
if (!urlPath || !outDir) {
  console.error('usage: extract-frames.mjs <urlPath> <outDir> [t0] [t1] [count] [scale]');
  process.exit(1);
}

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

const meta = await page.evaluate(async (src) => {
  const v = document.createElement('video');
  v.src = src;
  v.muted = true;
  v.playsInline = true;
  document.body.appendChild(v);
  window.__v = v;
  await new Promise((res, rej) => {
    v.onloadedmetadata = res;
    v.onerror = () => rej(new Error('video failed to load'));
  });
  return { duration: v.duration, w: v.videoWidth, h: v.videoHeight };
}, urlPath);

const start = Number(t0);
const end = Number(t1) || meta.duration - 0.05;
const n = Number(count);
const W = Math.round(meta.w * Number(scale));
const H = Math.round(meta.h * Number(scale));

console.log(JSON.stringify({ ...meta, start, end, n, out: `${W}x${H}` }));

for (let i = 0; i < n; i++) {
  const t = n === 1 ? start : start + ((end - start) * i) / (n - 1);
  const url = await page.evaluate(
    async ({ t, W, H }) => {
      const v = window.__v;
      await new Promise((res) => {
        v.onseeked = res;
        v.currentTime = t;
      });
      const c = document.createElement('canvas');
      c.width = W;
      c.height = H;
      c.getContext('2d').drawImage(v, 0, 0, W, H);
      return c.toDataURL('image/png');
    },
    { t, W, H }
  );
  await writeFile(
    `${outDir}/f${String(i).padStart(3, '0')}_${t.toFixed(2)}.png`,
    Buffer.from(url.split(',')[1], 'base64')
  );
}

console.log(`wrote ${n} frames to ${outDir}`);
await browser.close();
