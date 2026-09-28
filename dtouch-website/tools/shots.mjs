// Screenshots of the site at given scroll positions (in viewport heights).
// node dtouch-website/tools/shots.mjs [--mobile] 0,1,2.5 ...
import { chromium } from 'playwright-core';
import { resolve } from 'node:path'; import { pathToFileURL } from 'node:url'; import { mkdirSync } from 'node:fs';
const mobile = process.argv.includes('--mobile');
const list = (process.argv.find(a => /^[\d.,]+$/.test(a)) || '0').split(',').map(Number);
const vp = mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 };
const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await b.newPage({ viewport: vp, deviceScaleFactor: mobile ? 2 : 1, hasTouch: mobile, isMobile: mobile });
p.on('pageerror', e => console.log('PAGE ERROR', e.message)); p.on('console', m => m.type() === 'error' && console.log('CONSOLE', m.text()));
await p.goto((process.env.URL || 'http://localhost:8765/') + '?capture');
await p.waitForFunction(() => window.__ready, null, { timeout: 15000 });
const total = await p.evaluate(() => document.documentElement.scrollHeight / innerHeight);
console.log('page height (viewports):', total.toFixed(2));
mkdirSync('dtouch-website/tools/out', { recursive: true });
for (const v of list) {
  await p.evaluate(v => window.scrollTo(0, v * innerHeight), v);
  await p.waitForTimeout(700);
  await p.screenshot({ path: `dtouch-website/tools/out/${mobile ? 'm' : 'd'}-${v}.png` });
}
await b.close();
