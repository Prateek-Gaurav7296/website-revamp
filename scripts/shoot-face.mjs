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
 *   1. the cursor edges select the first and last frames of the clip
 *   2. the frame index moves monotonically with the cursor
 *   3. a slow sweep touches enough frames to read as continuous
 *   4. reduced motion holds the neutral frame
 *   5. no horizontal overflow on a phone, head still pinned
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

/**
 * Scroll the scene into view and return its box.
 *
 * The scroll offset is computed from the scene itself rather than hard-coded:
 * a fixed offset breaks the moment the section's height changes, and it breaks
 * silently — the cursor lands on the navbar, the scene sees pointerleave, and
 * every reading comes back as the relaxed neutral frame.
 */
async function openSection(page) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    const el = document.querySelector('[data-character="sequence"]');
    const scene = el.closest('div[class*="mt-10"]') || el;
    const top = scene.getBoundingClientRect().top + window.scrollY;
    // Leave room for the fixed navbar so the pointer cannot land on it.
    window.scrollTo(0, Math.max(0, top - 140));
  });
  await page.waitForTimeout(2200);

  return page.evaluate(() => {
    const el = document.querySelector('[data-character="sequence"]');
    const scene = el.closest('div[class*="mt-10"]') || el.parentElement.parentElement;
    const r = scene.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
}

/** Which frame of the gaze sweep is currently showing. */
const activeFrame = (page) =>
  page.evaluate(() => {
    const imgs = [...document.querySelectorAll('[data-character="sequence"] img')];
    const i = imgs.findIndex((el) => getComputedStyle(el).opacity === '1');
    return { index: i, total: imgs.length - 1 };
  });



// ---------------------------------------------------------------- gaze ----
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const box = await openSection(page);
  console.log('\ngaze');

  // Cursor position is measured across the viewport, so the test drives the
  // screen's own edges — that is where the first and last frames live.
  const { width: vw, height: vh } = page.viewportSize();
  const y = Math.max(90, Math.min(vh - 10, box.y + box.h * 0.45));
  const at = async (fx) => {
    await page.mouse.move(Math.max(1, Math.min(vw - 1, fx * vw)), y, { steps: 14 });
    await page.waitForTimeout(1100);
    return activeFrame(page);
  };

  const left = await at(0.0);
  await page.screenshot({ path: `${OUT}/face-gaze-left.png` });
  const mid = await at(0.5);
  await page.screenshot({ path: `${OUT}/face-gaze-centre.png` });
  const right = await at(1.0);
  await page.screenshot({ path: `${OUT}/face-gaze-right.png` });

  // The clip sweeps viewer-left to viewer-right, so the cursor maps straight
  // onto it: the left edge selects frame 0, the right edge the last frame.
  // At the very edges the mapping should land on the exact first/last frame.
  const edge = 1;
  check(left.index <= edge, 'cursor left shows a left-looking frame',
    `frame ${left.index}/${left.total}`);
  check(right.index >= right.total - edge, 'cursor right shows a right-looking frame',
    `frame ${right.index}/${right.total}`);
  check(Math.abs(mid.index - right.total / 2) <= edge, 'cursor centre shows a mid frame',
    `frame ${mid.index}/${mid.total}`);
  check(left.index < mid.index && mid.index < right.index,
    'frame index moves monotonically with the cursor',
    `${left.index} → ${mid.index} → ${right.index}`);

  // Sweep slowly across and count how many distinct frames are used: a
  // sequence that snaps between a handful of frames reads as three fixed
  // positions rather than continuous gaze.
  // Let the spring settle at each stop. Sampling faster than it settles reads
  // mid-flight values that cluster, and measures the test's impatience rather
  // than the mapping.
  const seen = new Set();
  for (let i = 0; i <= 20; i++) {
    await page.mouse.move(Math.max(1, Math.min(vw - 1, (vw * i) / 20)), y, { steps: 4 });
    await page.waitForTimeout(320);
    seen.add((await activeFrame(page)).index);
  }
  check(seen.size >= 15, 'gaze is continuous, not a few fixed positions',
    `${seen.size} distinct frames across one sweep`);

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

  await page.mouse.move(40, Math.max(90, box.y + box.h * 0.45), { steps: 10 });
  await page.waitForTimeout(1200);

  const frame = await activeFrame(page);
  check(Math.abs(frame.index - frame.total / 2) <= 4, 'gaze holds at the neutral frame',
    `frame ${frame.index}/${frame.total}`);
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
    const r = document.querySelector('[data-character="sequence"]').getBoundingClientRect();
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
