// Records a smooth scroll-through of the site to MP4 (for previews / sharing).
// node dtouch-website/tools/record.mjs [--mobile] [--seconds 55]
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
const mobile = process.argv.includes('--mobile');
const i = process.argv.indexOf('--seconds'); const secs = i > -1 ? +process.argv[i + 1] : 55;
const fps = 30, vp = mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 };
const out = `dtouch-website/preview/dtouch-scroll-${mobile ? 'mobile' : 'desktop'}.mp4`;
const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await b.newPage({ viewport: vp, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
await p.goto((process.env.URL || 'http://localhost:8765/') + '?capture');
await p.waitForFunction(() => window.__ready);
await p.waitForTimeout(600);
const max = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
const heroEnd = await p.evaluate(() => innerHeight * (matchMedia('(max-width: 980px)').matches ? 3.3 : 4.4));
const ff = spawn(process.env.FFMPEG || 'ffmpeg', ['-y', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
const N = secs * fps, heroShare = 0.24;             // the hero gets ~a quarter of the running time
const ease = x => x < .5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2;
for (let f = 0; f < N; f++) {
  const u = f / (N - 1);
  const y = u < heroShare ? heroEnd * ease(u / heroShare) : heroEnd + (max - heroEnd) * ease((u - heroShare) / (1 - heroShare));
  await p.evaluate(y => window.scrollTo(0, y), y);
  await p.waitForTimeout(8);
  const buf = await p.screenshot({ type: 'jpeg', quality: 92 });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
}
ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close();
console.log('wrote', out);
