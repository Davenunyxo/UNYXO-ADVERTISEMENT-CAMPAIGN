// Renders the 3D trailer (trailer/index.html) to frames with N parallel headless-Chrome workers, then encodes MP4.
//   node trailer/render.mjs --stills 1,5.5,12            → trailer/out/still-<t>.png
//   node trailer/render.mjs [--workers 3] [--fps 24]      → out/unyxo-trailer-reels.mp4 (with trailer/score.wav if present)
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const fps = +arg('fps', 24), duration = +arg('duration', 30), workers = +arg('workers', 3);
const stills = arg('stills', ''), out = arg('out', 'out/unyxo-trailer-reels.mp4');
const from = +arg('from', 0), to = +arg('to', duration);
const chrome = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ffmpeg = process.env.FFMPEG || 'ffmpeg';
const ROOT = resolve('trailer');

// tiny static server (ES modules + fetch need http)
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png' };
const server = createServer((q, r) => { const p = join(ROOT, decodeURIComponent(q.url.split('?')[0]).replace(/^\/$/, '/index.html'));
  if (!p.startsWith(ROOT) || !existsSync(p)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); r.end(readFileSync(p)); });
await new Promise(r => server.listen(0, r)); const url = `http://127.0.0.1:${server.address().port}/`;

async function open() {
  const b = await chromium.launch({ executablePath: chrome, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--force-color-profile=srgb'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.error('PAGE ERROR', e.message)); p.on('console', m => m.type() === 'error' && console.error('CONSOLE', m.text()));
  await p.goto(url); await p.waitForFunction(() => window.ready && window.ready.then, null, { timeout: 120000 }); await p.evaluate(() => window.ready);
  return { b, p };
}

if (stills) {
  mkdirSync('trailer/out', { recursive: true });
  const { b, p } = await open();
  for (const t of stills.split(',').map(Number)) { const t0 = Date.now(); await p.evaluate(t => window.renderFrame(t), t); await p.screenshot({ path: `trailer/out/still-${t.toFixed(2)}.png` }); console.log(`t=${t} (${Date.now() - t0} ms)`); }
  await b.close();
} else {
  const dir = 'trailer/frames'; if (from === 0) rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  const f0 = Math.round(from * fps), f1 = Math.round(to * fps);
  let next = f0, done = 0; const t0 = Date.now();
  await Promise.all(Array.from({ length: workers }, async () => {
    const { b, p } = await open();
    for (let f; (f = next++) < f1;) {
      await p.evaluate(t => window.renderFrame(t), f / fps);
      await p.screenshot({ path: `${dir}/f${String(f).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 96 });
      if (++done % 24 === 0) console.log(`${done}/${f1 - f0} frames · ${((Date.now() - t0) / 1000 / done).toFixed(2)} s/frame`);
    }
    await b.close();
  }));
  if (to >= duration) {
    const audio = existsSync('trailer/score.wav') ? ['-i', 'trailer/score.wav'] : ['-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000'];
    await new Promise((res, rej) => spawn(ffmpeg, ['-y', '-framerate', String(fps), '-i', `${dir}/f%05d.jpg`, ...audio, '-t', String(duration),
      '-c:v', 'libx264', '-preset', 'slow', '-profile:v', 'high', '-level', '4.2', '-crf', '14', '-maxrate', '25M', '-bufsize', '50M', '-pix_fmt', 'yuv420p',
      '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv', '-r', String(fps), '-g', String(fps * 2),
      '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', '-movflags', '+faststart', out], { stdio: 'inherit' }).on('close', c => c ? rej(c) : res()));
    console.log('wrote', out);
  }
}
server.close();
