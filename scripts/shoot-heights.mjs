/**
 * Every beat must fit one screen.
 *
 *   node scripts/shoot-heights.mjs [baseUrl]
 *
 * The page snaps one section per scroll gesture. Mandatory snapping is only
 * safe while every stop fits the viewport — a section taller than the screen
 * makes its own lower half unreachable, because the snap pulls the visitor
 * past it. So the height budget is a correctness constraint, not a taste one,
 * and it is easy to blow by adding two lines of copy.
 *
 * Measures every section at the breakpoints that matter and fails on any that
 * overflows its screen.
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:3100';

const VIEWPORTS = [
  { w: 1440, h: 900, snap: 'mandatory' },
  { w: 1280, h: 800, snap: 'mandatory' },
  { w: 768, h: 1024, snap: 'mandatory' },
  { w: 390, h: 844, snap: 'proximity' },
];

const browser = await chromium.launch();
let failed = 0;

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);

  // Visit each beat so lazy media and reveals have settled before measuring.
  const ids = await page.evaluate(() =>
    [...document.querySelectorAll('section[id]')].map((s) => s.id)
  );
  for (const id of ids) {
    await page.evaluate((s) => {
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, document.getElementById(s).offsetTop);
    }, id);
    await page.waitForTimeout(500);
  }

  const rows = await page.evaluate(() =>
    [...document.querySelectorAll('section[id]')].map((s) => ({
      id: s.id,
      h: Math.round(s.getBoundingClientRect().height),
    }))
  );

  console.log(`\n${vp.w}x${vp.h}  (${vp.snap})`);
  for (const r of rows) {
    // A couple of pixels over is rounding, not a layout problem.
    const over = r.h - vp.h;
    const ok = vp.snap !== 'mandatory' || over <= 2;
    if (!ok) failed += 1;
    console.log(
      `  ${ok ? ' ok ' : 'FAIL'}  ${r.id.padEnd(13)} ${String(r.h).padStart(5)}px` +
        (over > 2 ? `  (+${over} over the screen)` : '')
    );
  }
  await page.close();
}

await browser.close();
console.log(failed ? `\n${failed} section(s) overflow their screen\n` : '\nevery beat fits\n');
process.exit(failed ? 1 : 0);
