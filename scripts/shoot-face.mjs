/**
 * Regression harness for the "How It's Made" character.
 *
 *   node scripts/shoot-face.mjs [baseUrl]
 *
 * The eye tracking and blink are the easiest things on this site to break
 * silently — a CSS change can leave the irises pinned, the lid stuck open, or
 * the aperture mask misaligned, and the page will still build and still look
 * fine in a still screenshot. This drives a real browser and asserts on the
 * measured transforms instead.
 *
 * Checks, in order:
 *   1. horizontal gaze reaches 8–15px in each direction
 *   2. the two eyes do not move identically
 *   3. vertical gaze is real, and smaller than horizontal
 *   4. the lid actually closes, at randomised intervals
 *   5. reduced motion disables both
 *   6. no horizontal overflow on a phone
 *
 * Screenshots land in .screenshots/face-*.png.
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = process.argv[2] || 'http://localhost:3100';
const OUT = '.screenshots';

await mkdir(OUT, { recursive: true });

const failures = [];
const check = (ok, label, detail) => {
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures.push(label);
};

const browser = await chromium.launch();

/** Scroll the character into view and return the interactive stage's box. */
async function openSection(page) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, document.getElementById('process').offsetTop + 430);
  });
  await page.waitForTimeout(2200);
  return page.evaluate(() => {
    const img = document.querySelector('img[alt="A creative director, watching"]');
    const r = img.closest('.relative').parentElement.parentElement.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
}

const irisShift = (page) =>
  page.evaluate(() => {
    const out = {};
    for (const side of ['left', 'right']) {
      const el = document.querySelector(`img[src*="iris-${side}"]`).parentElement;
      const m = new DOMMatrix(getComputedStyle(el).transform);
      out[side] = { x: +m.e.toFixed(2), y: +m.f.toFixed(2) };
    }
    return out;
  });

// ---------------------------------------------------------------- gaze ----
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const box = await openSection(page);
  console.log('\ngaze');

  const at = async (fx, fy) => {
    await page.mouse.move(
      Math.max(2, Math.min(1438, box.x + box.w * fx)),
      Math.max(80, Math.min(898, box.y + box.h * fy)),
      { steps: 14 }
    );
    await page.waitForTimeout(1100);
    return irisShift(page);
  };

  const left = await at(0.04, 0.4);
  await page.screenshot({ path: `${OUT}/face-gaze-left.png` });
  const right = await at(0.96, 0.4);
  await page.screenshot({ path: `${OUT}/face-gaze-right.png` });
  const down = await at(0.5, 0.98);

  const travel = Math.abs(left.left.x);
  check(travel >= 8 && travel <= 15, 'horizontal travel within 8–15px', `${travel}px`);
  check(left.left.x < -4 && right.left.x > 4, 'eyes follow the cursor both ways',
    `${left.left.x} → ${right.left.x}`);
  check(Math.abs(left.left.x - left.right.x) > 0.1, 'eyes are not mechanically identical',
    `${left.left.x} vs ${left.right.x}`);
  check(down.left.y > 1, 'vertical tracking is live', `${down.left.y}px`);
  check(down.left.y < travel, 'vertical travel is smaller than horizontal',
    `${down.left.y} < ${travel}`);

  await page.close();
}

// --------------------------------------------------------------- blink ----
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await openSection(page);
  console.log('\nblink');

  const samples = await page.evaluate(async () => {
    const el = document.querySelector('img[src*="lid-left"]');
    const out = [];
    const t0 = performance.now();
    while (performance.now() - t0 < 12000) {
      out.push([performance.now() - t0, new DOMMatrix(getComputedStyle(el).transform).d]);
      await new Promise((r) => setTimeout(r, 25));
    }
    return out;
  });

  const events = [];
  let prev = -1e9;
  for (const [t, d] of samples) {
    if (d > 0.85 && t - prev > 300) events.push(Math.round(t));
    if (d > 0.85) prev = t;
  }
  const gaps = events.slice(1).map((t, i) => t - events[i]);

  check(events.length >= 2, 'lid closes repeatedly', `${events.length} blinks in 12s`);
  check(Math.max(...samples.map((s) => s[1])) > 0.95, 'lid reaches full closure');
  check(gaps.every((g) => g > 2000 && g < 6000), 'blink gaps are randomised, not fixed',
    gaps.join('ms, ') + 'ms');
  check(new Set(gaps).size === gaps.length, 'no two gaps are identical');

  await page.close();
}

// ------------------------------------------------------ reduced motion ----
{
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    reducedMotion: 'reduce',
  });
  const box = await openSection(page);
  console.log('\nreduced motion');

  await page.mouse.move(box.x + 40, box.y + box.h * 0.45, { steps: 10 });
  await page.waitForTimeout(1200);

  const iris = await irisShift(page);
  const lidClosed = await page.evaluate(
    () => new DOMMatrix(getComputedStyle(document.querySelector('img[src*="lid-left"]')).transform).d
  );

  check(iris.left.x === 0 && iris.left.y === 0, 'pupils do not move', JSON.stringify(iris.left));
  check(lidClosed < 0.05, 'blinking is off', `lid scaleY ${lidClosed}`);
  await page.screenshot({ path: `${OUT}/face-reduced-motion.png` });
  await page.close();
}

// -------------------------------------------------------------- mobile ----
{
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
  });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, document.getElementById('process').offsetTop);
  });
  await page.waitForTimeout(1600);
  console.log('\nmobile');

  await page.screenshot({ path: `${OUT}/face-mobile-1.png` });
  await page.evaluate(() => window.scrollBy(0, 520));
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `${OUT}/face-mobile-2.png` });

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  const faceVisible = await page.evaluate(() => {
    const r = document
      .querySelector('img[alt="A creative director, watching"]')
      .getBoundingClientRect();
    return r.bottom > 100 && r.top < window.innerHeight;
  });

  check(overflow === 0, 'no horizontal overflow', `${overflow}px`);
  check(faceVisible, 'the head stays pinned while the stages scroll');
  await page.close();
}

await browser.close();

console.log(
  failures.length ? `\n${failures.length} check(s) failed\n` : '\nall checks passed\n'
);
process.exit(failures.length ? 1 : 0);
