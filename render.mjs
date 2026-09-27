// Renders ad/index.html frame-by-frame and encodes it to MP4.
// Usage: node render.mjs [--fps 30] [--duration 10] [--stills 1.5,4.8,9.5]
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const fps = +arg('fps', 30);
const duration = +arg('duration', 15);
const stills = arg('stills', '');
const ffmpeg = process.env.FFMPEG || 'ffmpeg';
const chrome = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

mkdirSync('out', { recursive: true });
const browser = await chromium.launch({ executablePath: chrome, args: ['--force-color-profile=srgb'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(pathToFileURL(resolve('ad/index.html')).href);
await page.evaluate(() => window.ready);

if (stills) {
  for (const t of stills.split(',').map(Number)) {
    await page.evaluate(t => window.render(t), t);
    await page.screenshot({ path: `out/still-${t.toFixed(2)}s.png` });
  }
} else {
  const out = 'out/unyxo-smart-booking-ad.mp4';
  const ff = spawn(ffmpeg, ['-y', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const frames = Math.round(fps * duration);
  for (let f = 0; f < frames; f++) {
    await page.evaluate(t => window.render(t), f / fps);
    const buf = await page.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 30 === 0) process.stderr.write(`frame ${f}/${frames}\n`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  console.log(`wrote ${out}`);
}
await browser.close();
