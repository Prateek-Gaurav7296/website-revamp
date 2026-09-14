/**
 * Visual QA: renders the site and writes one screenshot per narrative beat,
 * at desktop and mobile widths, into .screenshots/.
 *
 *   node scripts/shoot.mjs [baseUrl]
 *
 * Scroll reveals are settled before capture by waiting for the page to be
 * fully in view rather than by disabling motion, so what lands in the PNG is
 * the finished frame a visitor actually sees.
 */
import { chromium } from 'playwright';
import { mkdir, rm } from 'node:fs/promises';

const BASE = process.argv[2] || 'http://localhost:3100';
const OUT = '.screenshots';

const SECTIONS = ['top', 'premise', 'work', 'process', 'proof', 'testimonials', 'team', 'start'];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844, isMobile: true },
];

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();

for (const viewport of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 2,
    hasTouch: Boolean(viewport.isMobile),
  });
  const page = await context.newPage();

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  // Let the opening leader clear and the hero title card finish.
  await page.waitForTimeout(2600);

  await page.screenshot({ path: `${OUT}/${viewport.name}-00-hero.png` });

  for (const [index, id] of SECTIONS.entries()) {
    if (id === 'top') continue;

    await page.evaluate((sectionId) => {
      document.documentElement.style.scrollBehavior = 'auto';
      const element = document.getElementById(sectionId);
      window.scrollTo(0, element ? element.offsetTop : 0);
    }, id);

    // One beat for the reveal, one for the spring to settle.
    await page.waitForTimeout(1200);
    await page.screenshot({
      path: `${OUT}/${viewport.name}-${String(index).padStart(2, '0')}-${id}.png`,
    });
  }

  // Full page, for checking overall rhythm and section separation.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${viewport.name}-full.png`, fullPage: true });

  await context.close();
  console.log(`captured ${viewport.name}`);
}

await browser.close();
console.log(`\nScreenshots in ${OUT}/`);
