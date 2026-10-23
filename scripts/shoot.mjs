/* Dev helper: renders the playground headless and saves stage screenshots. */
import { chromium } from 'playwright-core';
const out = process.argv[2];
const which = (process.argv[3] || 'volt,pip,mochi,boo,inky').split(',');
const states = (process.argv[4] || 'idle').split(',');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
page.on('console', (m) => console.log('console:', m.text().slice(0, 2000)));
page.on('pageerror', (e) => console.log('pageerror:', e.message.slice(0, 3000)));
await page.goto('file://' + new URL('../dist/playground.html', import.meta.url).pathname);
await page.waitForTimeout(1500);
const names = { volt: 0, pip: 1, mochi: 2, boo: 3, inky: 4 };
for (const w of which) {
  await page.click(`#roster .tile:nth-child(${names[w] + 1})`);
  for (const s of states) {
    await page.click(`#states button[data-state="${s}"]`);
    await page.mouse.move(640, 300);
    await page.waitForTimeout(2500);
    await page.locator('.stage').screenshot({ path: `${out}/${w}-${s}.png` });
  }
}
if (process.argv[5] === 'full') await page.screenshot({ path: `${out}/full.png`, fullPage: true });
await browser.close();
