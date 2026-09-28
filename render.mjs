// Renders ad/index.html frame-by-frame and encodes it to MP4.
// Usage: node render.mjs [--fps 30] [--duration 10] [--stills 1.5,4.8,9.5]
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const fps = +arg('fps', 30);
const duration = +arg('duration', 30);
const stills = arg('stills', '');
const portrait = process.argv.includes('--portrait'); // Instagram Reels 1080×1920
const [W, H] = portrait ? [1080, 1920] : [1920, 1080];
const ffmpeg = process.env.FFMPEG || 'ffmpeg';
const chrome = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

mkdirSync('out', { recursive: true });
const browser = await chromium.launch({ executablePath: chrome, args: ['--force-color-profile=srgb'] });
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.goto(pathToFileURL(resolve('ad/index.html')).href + (portrait ? '?portrait' : ''));
await page.evaluate(() => window.ready);

if (stills) {
  for (const t of stills.split(',').map(Number)) {
    await page.evaluate(t => window.render(t), t);
    await page.screenshot({ path: `out/${portrait ? 'reels-' : ''}still-${t.toFixed(2)}s.png` });
  }
} else {
  const out = portrait ? 'out/unyxo-smart-booking-ad-reels.mp4' : 'out/unyxo-smart-booking-ad.mp4';
  // Instagram-friendly: H.264 High@4.2, yuv420p, constant 30fps, high bitrate, AAC audio, faststart
  const ff = spawn(ffmpeg, ['-y', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    // sound effects from `python3 sfx.py` (ad/sfx.wav); silent track if it hasn't been generated
    ...(existsSync('ad/sfx.wav') ? ['-i', 'ad/sfx.wav'] : ['-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000']),
    '-t', String(duration),
    '-c:v', 'libx264', '-preset', 'slow', '-profile:v', 'high', '-level', '4.2', '-crf', '15',
    '-maxrate', '25M', '-bufsize', '50M', '-pix_fmt', 'yuv420p', '-r', String(fps), '-g', String(fps * 2),
    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', out],
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
