// UNYXO SYSTEMS — 30s 3D trailer (1080×1920, 24 fps). Every frame is a pure function of t → deterministic renders.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { Reflector } from 'three/addons/objects/Reflector.js';

const W = 1080, H = 1920;
// ------------------------------------------------------------------ math / timing helpers
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const P = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, x) => a + (b - a) * x;
const eo = x => 1 - Math.pow(1 - x, 3), ei = x => x * x * x;
const expo = x => x >= 1 ? 1 : 1 - Math.pow(2, -10 * x);
const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const back = x => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const pulse = (t, at, w) => Math.max(0, 1 - Math.abs(t - at) / w);
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const $ = id => document.getElementById(id);

// ------------------------------------------------------------------ timeline (seconds)
const T = { card: [0, 2.3], pres: [2.3, 5.0], world: [5.0, 7.0], city: [7.0, 10.3], vil: [10.3, 14.3], chaos: [14.3, 16.0],
  sky: [16.0, 17.4], hero: [17.4, 20.8], one: [20.8, 25.2], rev: [25.2, 27.2], end: [27.2, 30.0] };

// ------------------------------------------------------------------ renderer + post
const canvas = $('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// studio environment: dark room with soft strip lights → Apple-style chrome reflections
function studioEnv() {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.BoxGeometry(30, 30, 30), new THREE.MeshBasicMaterial({ color: 0x060709, side: THREE.BackSide })));
  const strip = (w, h, x, y, z, ry, col, k) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.rotation.y = ry; s.add(m); };
  strip(2.2, 18, -9, 0, 3, Math.PI / 2.4, 0xffffff, 7);
  strip(2.2, 18, 9, 0, 3, -Math.PI / 2.4, 0xffffff, 6);
  strip(14, 1.6, 0, 11, 0, 0, 0xffffff, 5); s.children.at(-1).rotation.x = Math.PI / 2;
  strip(6, 3, 0, 2, -14, 0, 0xffffff, 3);
  strip(1.2, 10, -5, -2, 12, Math.PI, 0x7df0ff, 3.5);
  strip(1.2, 10, 5, -2, 12, Math.PI, 0xd8a8ff, 3.5);
  strip(20, 2, 0, -9, 4, 0, 0xffffff, 1.2); s.children.at(-1).rotation.x = -Math.PI / 2;
  const pm = new THREE.PMREMGenerator(renderer);
  return pm.fromScene(s, 0.02).texture;
}
const ENV = studioEnv();

const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }));
const renderPass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.6, 0.55, 0.85);
const filmPass = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uGrain: { value: .05 }, uVig: { value: .55 }, uCA: { value: .0025 }, uWhip: { value: 0 } },
  vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader: `uniform sampler2D tDiffuse;uniform float uTime,uGrain,uVig,uCA,uWhip;varying vec2 vUv;
    float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
    void main(){vec2 uv=vUv;vec3 c;
      if(uWhip>.001){c=vec3(0.);for(int i=-10;i<=10;i++){c+=texture2D(tDiffuse,uv+vec2(float(i)/10.*uWhip*.09,0.)).rgb;}c/=21.;}
      else{float ca=uCA*length(uv-.5);c=vec3(texture2D(tDiffuse,uv+vec2(ca,0.)).r,texture2D(tDiffuse,uv).g,texture2D(tDiffuse,uv-vec2(ca,0.)).b);}
      float v=smoothstep(1.05,.32,length((uv-.5)*vec2(1.,1.2)));c*=mix(1.,v,uVig);
      c+=(h(uv*vec2(1080.,1920.)+fract(uTime*7.31)*91.)-.5)*uGrain;
      gl_FragColor=vec4(c,1.);}`,
});
composer.addPass(renderPass); composer.addPass(bloom); composer.addPass(new OutputPass()); composer.addPass(filmPass);

// ------------------------------------------------------------------ textures
function ctex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.userData = { c, g, draw }; return t;
}
function redraw(t, ...a) { const { c, g, draw } = t.userData; g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.globalAlpha = 1; g.clearRect(0, 0, c.width, c.height); draw(g, c.width, c.height, ...a); t.needsUpdate = true; }
function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
const glowTex = ctex(128, 128, (g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
const beamTex = ctex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h); const gx = g.createLinearGradient(0, 0, w, 0); gx.addColorStop(0, 'rgba(0,0,0,1)'); gx.addColorStop(.5, 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,1)');
  g.globalCompositeOperation = 'destination-out'; g.fillStyle = gx; g.fillRect(0, 0, w, h); });
const bgTex = (inner, outer) => ctex(512, 1024, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h * .42, 20, w / 2, h * .5, h * .62); gr.addColorStop(0, inner); gr.addColorStop(1, outer); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
const paperTex = ctex(256, 330, (g, w, h) => { g.fillStyle = '#fbfbf8'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(40,120,70,.35)'; g.lineWidth = 2;
  for (let x = 16; x < w; x += 44) { g.beginPath(); g.moveTo(x, 20); g.lineTo(x, h - 16); g.stroke(); } for (let y = 20; y < h; y += 22) { g.beginPath(); g.moveTo(10, y); g.lineTo(w - 10, y); g.stroke(); }
  g.fillStyle = 'rgba(34,160,90,.35)'; g.fillRect(16, 20, w - 32, 22); g.fillStyle = 'rgba(255,90,90,.25)'; g.fillRect(104, 152, 44, 22); });
function tagTex(text, bg, fg, font = '700 64px "Inter Display"') {
  const m = document.createElement('canvas').getContext('2d'); m.font = font; const tw = m.measureText(text).width;
  return ctex(Math.ceil(tw + 90), 130, (g, w, h) => { g.fillStyle = bg; rr(g, 4, 4, w - 8, h - 8, 44); g.fill(); g.font = font; g.fillStyle = fg; g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillText(text, w / 2, h / 2 + 3); });
}
function stampTex(text, col) { return ctex(700, 260, (g, w, h) => { g.strokeStyle = col; g.lineWidth = 16; rr(g, 14, 14, w - 28, h - 28, 26); g.stroke(); g.lineWidth = 5; rr(g, 34, 34, w - 68, h - 68, 16); g.stroke();
  g.font = '900 150px "Inter Display"'; g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 8);
  g.globalCompositeOperation = 'destination-out'; const r = rng(7); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(0,0,0,${r() * .6})`; g.fillRect(r() * w, r() * h, 2 + r() * 5, 2 + r() * 4); } }); }
const invoiceTex = ctex(660, 880, (g, w, h) => {
  g.fillStyle = '#fbf7f0'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#1d1d1f'; g.font = '900 78px "Inter Display"'; g.fillText('INVOICE', 56, 120); g.font = '600 38px "Inter Display"'; g.fillStyle = '#8e8e93'; g.fillText('#1042', 56, 175);
  g.fillStyle = '#e5e1d8'; for (let i = 0; i < 4; i++) { rr(g, 56, 600 + i * 34, 380 - i * 60, 14, 7); g.fill(); }
  g.strokeStyle = '#d6d0c4'; g.lineWidth = 3; g.beginPath(); g.moveTo(56, 760); g.lineTo(w - 56, 760); g.stroke();
  g.fillStyle = '#1d1d1f'; g.font = '800 44px "Inter Display"'; g.fillText('TOTAL', 56, 830); g.textAlign = 'right'; g.fillText('$1,240', w - 56, 830);
});
const teethTex = ctex(360, 140, (g, w, h) => { g.fillStyle = '#1b1b1d'; rr(g, 0, 0, w, h, 50); g.fill(); g.fillStyle = '#fff'; rr(g, 12, 12, w - 24, h - 24, 40); g.fill();
  g.strokeStyle = '#1b1b1d'; g.lineWidth = 7; g.beginPath(); g.moveTo(12, h / 2); g.lineTo(w - 12, h / 2); g.stroke(); for (let x = 60; x < w - 30; x += 48) { g.beginPath(); g.moveTo(x, 12); g.lineTo(x, h - 12); g.stroke(); } });
const tapeTex = ctex(620, 170, (g, w, h) => { g.fillStyle = '#e9e6dc'; g.beginPath(); g.moveTo(10, 0); for (let x = 10; x <= w - 10; x += 20) g.lineTo(x, (x / 20) % 2 ? 6 : 0);
  g.lineTo(w, h / 2); g.lineTo(w - 10, h); for (let x = w - 10; x >= 10; x -= 20) g.lineTo(x, h - ((x / 20) % 2 ? 6 : 0)); g.lineTo(0, h / 2); g.closePath(); g.fill();
  g.font = '900 104px "Inter Display"'; g.fillStyle = '#2b2b2e'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('MUTED', w / 2, h / 2 + 5); });
const badgeTex = ctex(260, 260, (g, w) => { g.fillStyle = '#ff3b30'; g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 6, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 12; g.stroke();
  g.font = '900 104px "Inter Display"'; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('99+', w / 2, w / 2 + 6); });
const dashTex = ctex(1040, 1600, (g, w, h) => {
  g.fillStyle = '#0d0e12'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#fff'; g.font = '800 64px "Inter Display"'; g.fillText('Good morning, Alex', 64, 150); g.fillStyle = '#86868b'; g.font = '500 34px "Inter Display"'; g.fillText('Everything is running smoothly.', 64, 206);
  [['Revenue', '$48,290', '#4ade80'], ['Bookings', '214', '#7df0ff'], ['Paid on time', '98%', '#d8a8ff']].forEach(([l, v, c], i) => { const x = 64 + i * 312;
    g.fillStyle = '#17181d'; rr(g, x, 270, 288, 200, 32); g.fill(); g.fillStyle = '#86868b'; g.font = '600 28px "Inter Display"'; g.fillText(l, x + 28, 330); g.fillStyle = c; g.font = '800 58px "Inter Display"'; g.fillText(v, x + 28, 420); });
  g.fillStyle = '#17181d'; rr(g, 64, 510, w - 128, 520, 36); g.fill(); g.fillStyle = '#fff'; g.font = '700 36px "Inter Display"'; g.fillText('This month', 100, 580);
  const pts = [2, 3, 2.6, 4, 4.4, 4.1, 5.4, 6, 5.7, 7, 7.7, 8.6].map((v, i) => [110 + i * 74, 980 - v * 44]);
  const gr = g.createLinearGradient(0, 600, 0, 1000); gr.addColorStop(0, 'rgba(125,240,255,.35)'); gr.addColorStop(1, 'rgba(125,240,255,0)');
  g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.lineTo(pts.at(-1)[0], 1000); g.lineTo(110, 1000); g.fillStyle = gr; g.fill();
  const lg = g.createLinearGradient(110, 0, 924, 0); lg.addColorStop(0, '#7df0ff'); lg.addColorStop(1, '#c79bff');
  g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.strokeStyle = lg; g.lineWidth = 9; g.lineJoin = 'round'; g.stroke();
  g.fillStyle = '#fff'; g.font = '700 36px "Inter Display"'; g.fillText('Today', 64, 1110);
  [['9:00', 'Ava Thompson', 'Consultation'], ['10:30', 'Liam Chen', 'Follow-up'], ['13:00', 'Mia Garcia', 'Fitting'], ['15:30', 'Noah Kim', 'Check-in']].forEach(([a, b, c], i) => { const y = 1170 + i * 100;
    g.fillStyle = '#17181d'; rr(g, 64, y - 50, w - 128, 84, 24); g.fill(); g.fillStyle = '#86868b'; g.font = '600 30px "Inter Display"'; g.fillText(a, 96, y + 2);
    g.fillStyle = '#fff'; g.font = '700 32px "Inter Display"'; g.fillText(b, 230, y + 2); g.fillStyle = '#86868b'; g.font = '500 28px "Inter Display"'; g.textAlign = 'right'; g.fillText(c, w - 96, y + 2); g.textAlign = 'left'; });
});
const NAMES = ['Liam', 'Emma', 'Noah', 'Olivia', 'James', 'Ella', 'Lucas', 'Mia', 'Ava', 'Leo'];
const calTex = ctex(1040, 1600, (g, w, h, k = 0) => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#1d1d1f'; g.font = '800 70px "Inter Display"'; g.fillText('Bookings', 64, 150); g.fillStyle = '#86868b'; g.font = '500 36px "Inter Display"'; g.fillText('This week', 64, 210);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  days.forEach((d, i) => { g.fillStyle = '#86868b'; g.font = '700 30px "Inter Display"'; g.textAlign = 'center'; g.fillText(d, 150 + i * 185, 300); g.textAlign = 'left'; });
  g.strokeStyle = '#ececf0'; g.lineWidth = 2; for (let r = 0; r < 7; r++) { g.beginPath(); g.moveTo(64, 340 + r * 150); g.lineTo(w - 64, 340 + r * 150); g.stroke(); }
  const slots = [[0, 0], [2, 0], [4, 1], [1, 1], [3, 2], [0, 2], [2, 3], [4, 3], [1, 4], [3, 5]];
  slots.forEach(([c, r], i) => { const a = clamp(k * slots.length - i); if (a <= 0) return; const s = back(a);
    const x = 150 + c * 185, y = 415 + r * 150; g.save(); g.translate(x, y); g.scale(s, s);
    const col = ['#0a84ff', '#30d158', '#bf5af2', '#ff9f0a', '#64d2ff'][i % 5]; g.fillStyle = col + '2e'; rr(g, -88, -56, 176, 112, 26); g.fill(); g.strokeStyle = col; g.lineWidth = 5; g.stroke();
    g.fillStyle = col; g.font = '800 38px "Inter Display"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(NAMES[i], 0, 2); g.restore(); });
  if (k >= 1) { g.fillStyle = '#30d158'; rr(g, 64, 1400, w - 128, 110, 34); g.fill(); g.fillStyle = '#fff'; g.font = '800 44px "Inter Display"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('✓  Fully booked — no back-and-forth', w / 2, 1457); g.textAlign = 'left'; g.textBaseline = 'alphabetic'; }
});

// ------------------------------------------------------------------ materials
const chrome = new THREE.MeshPhysicalMaterial({ color: 0xe9ecf2, metalness: 1, roughness: .09, envMap: ENV, envMapIntensity: 1.0, clearcoat: 1, clearcoatRoughness: .04 });
const gold = new THREE.MeshPhysicalMaterial({ color: 0xffc766, metalness: 1, roughness: .16, envMap: ENV, envMapIntensity: 1.7, clearcoat: 1, clearcoatRoughness: .08 });
const glossy = (color, extra = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: .28, clearcoat: 1, clearcoatRoughness: .08, envMap: ENV, envMapIntensity: .9, ...extra });
const add = m => new THREE.Mesh(...m);

// ------------------------------------------------------------------ the UNYXO mark in 3D (tube + ring nodes, built from the logo geometry)
function makeLogo(mat = chrome) {
  const g = new THREE.Group(), S = 0.01, cx = 445, cy = 1000;
  const toV = (x, y) => new THREE.Vector3((x - cx) * S, -(y - cy) * S, 0);
  const rings = [[143, 920], [747, 920], [445, 1333]];
  const pts = [];
  for (let y = 674; y <= 1000; y += 4) pts.push([143, y]);
  for (let a = Math.PI; a >= 0; a -= Math.PI / 240) pts.push([445 + 302 * Math.cos(a), 1000 + 333 * Math.sin(a)]);
  for (let y = 1000; y >= 674; y -= 4) pts.push([747, y]);
  let run = [];
  const flush = () => { if (run.length > 3) g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(run.map(p => toV(...p))), run.length * 2, .62, 40, false), mat)); run = []; };
  for (const p of pts) { if (rings.some(([rx, ry]) => Math.hypot(p[0] - rx, p[1] - ry) < 104)) flush(); else run.push(p); }
  flush();
  [[143, 674], [747, 674]].forEach(p => { const s = new THREE.Mesh(new THREE.SphereGeometry(.62, 40, 24), mat); s.position.copy(toV(...p)); g.add(s); });
  rings.forEach(p => { const r = new THREE.Mesh(new THREE.TorusGeometry(.83, .31, 40, 120), mat); r.position.copy(toV(...p)); g.add(r); });
  return g;
}
// red cape (KitKat red) — cloth sim-lite driven by t
function makeCape() {
  const geo = new THREE.PlaneGeometry(1, 1, 26, 34); const base = geo.attributes.position.array.slice();
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xd2001e, roughness: .55, sheen: 1, sheenColor: new THREE.Color(0xff5a6e), sheenRoughness: .4, side: THREE.DoubleSide, envMap: ENV, envMapIntensity: .6 });
  const m = new THREE.Mesh(geo, mat);
  m.userData.update = (t, wind = 1, trail = 0) => {
    const a = geo.attributes.position.array;
    for (let i = 0; i < a.length; i += 3) {
      const u = base[i] + .5, v = .5 - base[i + 1];           // u across (0..1), v down (0 top..1 bottom)
      const width = lerp(4.6, 7.4, v);
      let x = (u - .5) * width, y = -v * 7.2, z = -.55 - v * .6;
      z += Math.sin(v * 5.5 - t * 7 * wind + u * 2.4) * .45 * v * wind + Math.sin(u * 9 + t * 5) * .08 * v;
      z += Math.sin(u * 17 + Math.sin(t * 2) * .6) * .2 * (.25 + v);            // pleats so it reads as fabric
      x += Math.sin(v * 3 - t * 4) * .25 * v * wind;
      // trail: cape streams back behind a flying hero
      y = lerp(y, -v * 2.2, trail); z = lerp(z, -.6 - v * 8.5 + Math.sin(v * 7 - t * 16 + u * 3) * .5 * v, trail);
      a[i] = x; a[i + 1] = 2.75 + y; a[i + 2] = z;
    }
    geo.attributes.position.needsUpdate = true; geo.computeVertexNormals();
  };
  return m;
}
function makeHero() { const g = new THREE.Group(); const logo = makeLogo(); const cape = makeCape(); g.add(cape, logo); g.userData = { logo, cape }; return g; }

// ------------------------------------------------------------------ characters: eyes, invoice, group chat, reply-all, #REF!
function makeEye(r = .42) {
  const g = new THREE.Group(), iris = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.SphereGeometry(r, 40, 28), glossy(0xffffff, { roughness: .2 })));
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(r * .52, 32, 20), glossy(0x0b0b0d, { roughness: .1 })); pupil.position.z = r * .6;
  const hl = new THREE.Mesh(new THREE.SphereGeometry(r * .14, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffffff })); hl.position.set(-r * .18, r * .2, r * 1.02);
  iris.add(pupil, hl); g.add(iris);
  g.userData = { look: (x, y) => { iris.rotation.set(-y * .55, x * .55, 0); }, blink: k => { g.scale.y = 1 - .92 * k; } };
  return g;
}
function eyes(g, dx, y, z, r) { const L = makeEye(r), R = makeEye(r); L.position.set(-dx, y, z); R.position.set(dx, y, z); g.add(L, R); return [L, R]; }
const brow = (w = .8) => new THREE.Mesh(new RoundedBoxGeometry(w, .17, .16, 3, .07), glossy(0x16161a));
function planeOf(tex, w, extra = {}) { const h = w * tex.image.height / tex.image.width; return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, ...extra })); }

function makeInvoice() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(3.3, 4.4, .22, 4, .08), new THREE.MeshStandardMaterial({ color: 0xf6f1e8, roughness: .75 }));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(3.12, 4.16), new THREE.MeshStandardMaterial({ map: invoiceTex, roughness: .8 })); face.position.z = .116;
  g.add(body, face);
  const E = eyes(g, .66, .45, .3, .42);
  const b1 = brow(), b2 = brow(); b1.position.set(-.66, 1.02, .34); b2.position.set(.66, 1.02, .34); g.add(b1, b2);
  const mouth = planeOf(teethTex, 1.05); mouth.position.set(0, -.45, .14); g.add(mouth);
  const smile = new THREE.Mesh(new THREE.TorusGeometry(.45, .07, 12, 40, Math.PI), glossy(0x1b1b1d)); smile.rotation.z = Math.PI; smile.position.set(0, -.3, .16); g.add(smile);
  const over = planeOf(stampTex('OVERDUE', '#e0192e'), 2.7); over.position.set(.1, -1.25, .2); over.rotation.z = .16; g.add(over);
  const paid = planeOf(stampTex('PAID', '#18a957'), 2.5); paid.position.set(0, -1.45, .24); paid.rotation.z = -.16; g.add(paid);
  g.userData = { E, b1, b2, mouth, smile, over, paid };
  return g;
}
function bubbleShape(w = 4, h = 2.8, r = .95) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(-.55, y); s.lineTo(-1.55, y - .95); s.lineTo(-1.15, y); // tail
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function makeChat() {
  const g = new THREE.Group();
  const geo = new THREE.ExtrudeGeometry(bubbleShape(), { depth: .7, bevelEnabled: true, bevelThickness: .28, bevelSize: .24, bevelSegments: 8, curveSegments: 32 }); geo.translate(0, 0, -.35);
  g.add(new THREE.Mesh(geo, glossy(0x2f6bff, { roughness: .22 })));
  const E = eyes(g, .72, .28, .72, .5);
  const b1 = brow(.7), b2 = brow(.7); b1.position.set(-.72, 1.0, .75); b2.position.set(.72, 1.0, .75); b1.rotation.z = .3; b2.rotation.z = -.3; g.add(b1, b2);
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(.2, 24, 16), glossy(0x0c0c10)); mouth.scale.set(1.3, .9, .5); mouth.position.set(0, -.55, .66); g.add(mouth);
  const tape = new THREE.Mesh(new RoundedBoxGeometry(2.9, .78, .06, 2, .02), new THREE.MeshStandardMaterial({ map: tapeTex, roughness: .8 })); tape.position.set(0, -.55, .8); tape.rotation.z = -.08; g.add(tape);
  const badge = planeOf(badgeTex, 1.15); badge.position.set(2.05, 1.45, .9); g.add(badge);
  const tags = [['see above', 1.9, -1.0, 1.9], ['ok but WHO', 1.9, 1.35, 2.7], ['???', 1.1, -2.2, -.7]].map(([tx, w, x, y]) => { const p = planeOf(tagTex(tx, '#ffffff', '#1d1d1f'), w); p.position.set(x, y, .4); g.add(p); return p; });
  g.userData = { E, b1, b2, mouth, tape, badge, tags };
  return g;
}
function makeEnvelope() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new RoundedBoxGeometry(4.4, 2.9, .5, 4, .12), new THREE.MeshStandardMaterial({ color: 0xebcd93, roughness: .72 })));
  const flapS = new THREE.Shape(); flapS.moveTo(-2.12, 1.38); flapS.lineTo(2.12, 1.38); flapS.lineTo(0, -.25); flapS.closePath();
  const flap = new THREE.Mesh(new THREE.ExtrudeGeometry(flapS, { depth: .05, bevelEnabled: true, bevelThickness: .03, bevelSize: .04, bevelSegments: 2 }), new THREE.MeshStandardMaterial({ color: 0xdfb56f, roughness: .7 }));
  flap.position.z = .26; g.add(flap);
  const E = eyes(g, .72, .62, .52, .4);
  E.forEach(e => { const lid = new THREE.Mesh(new THREE.SphereGeometry(.43, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xd9aa5c, roughness: .6 })); lid.rotation.x = -.35; e.add(lid); });
  const smile = new THREE.Mesh(new THREE.TorusGeometry(.62, .075, 12, 48, Math.PI * .9), glossy(0x3b2a12)); smile.rotation.z = Math.PI * 1.05; smile.position.set(.1, -.42, .36); g.add(smile);
  const tags = [['CC: everyone', 2.3, -1.25, 2.25], ['Re: Re: Fwd: Re:', 2.6, 1.2, -2.2]].map(([tx, w, x, y]) => { const p = planeOf(tagTex(tx, '#ffffff', '#6b4a12'), w); p.position.set(x, y, .6); g.add(p); return p; });
  g.userData = { E, flap, smile, tags };
  return g;
}
let FONT;
function makeRef() {
  const g = new THREE.Group();
  const geo = new TextGeometry('#REF!', { font: FONT, size: 1.25, depth: .5, curveSegments: 10, bevelEnabled: true, bevelThickness: .09, bevelSize: .05, bevelSegments: 5 });
  geo.center(); g.add(new THREE.Mesh(geo, glossy(0xff2d4b, { emissive: new THREE.Color(0x3a0010), roughness: .25 })));
  const E = eyes(g, .62, 1.42, .1, .42);
  const tags = [[-1.9, 1.9, .9], [2.0, -1.5, .75], [1.7, 2.35, .6], [-1.6, -2.1, .8]].map(([x, y, w]) => { const p = planeOf(tagTex('#REF!', '#ff2d4b', '#ffffff'), w); p.position.set(x, y, -.4); g.add(p); return p; });
  g.userData = { E, tags };
  return g;
}

// ------------------------------------------------------------------ scene scaffolding
const scenes = {};
function mkScene(bg) { const s = new THREE.Scene(); if (bg !== undefined) s.background = bg instanceof THREE.Texture ? bg : new THREE.Color(bg); s.environment = null; return s; }
function mkCam(fov = 35) { return new THREE.PerspectiveCamera(fov, W / H, .1, 2000); }
function lights(s, key = 2.4, fill = .6, rim = 0x7df0ff, rimK = 2) {
  s.add(new THREE.HemisphereLight(0xffffff, 0x222233, fill));
  const k = new THREE.DirectionalLight(0xffffff, key); k.position.set(4, 6, 8); s.add(k);
  const r = new THREE.DirectionalLight(rim, rimK); r.position.set(-6, 3, -6); s.add(r);
  const r2 = new THREE.DirectionalLight(0xd8a8ff, rimK * .8); r2.position.set(6, 2, -6); s.add(r2);
}
function stars(n, spread, seed, size = 2.2, color = 0xffffff) {
  const r = rng(seed), pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const th = r() * Math.PI * 2, ph = Math.acos(2 * r() - 1), R = spread; pos.set([R * Math.sin(ph) * Math.cos(th), Math.abs(R * Math.cos(ph)) * .9 + 20, R * Math.sin(ph) * Math.sin(th)], i * 3); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({ color, size, sizeAttenuation: false, map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
}
function sprites(n, seed, color, blending = THREE.AdditiveBlending, opacity = 1) {
  const g = new THREE.Group(), r = rng(seed);
  for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, blending, transparent: true, depthWrite: false, opacity }));
    s.userData = { a: r(), b: r(), c: r(), d: r(), e: r() }; g.add(s); }
  return g;
}

// ================================================================== S1 · UNYXO SYSTEMS presents (chrome mark, searchlights, mirror floor)
{
  const s = mkScene(0x030306), cam = mkCam(28);
  lights(s, 1.2, .25);
  const logo = makeLogo(); s.add(logo);
  const floor = new Reflector(new THREE.PlaneGeometry(60, 60), { textureWidth: 540, textureHeight: 960, color: 0x16161c }); floor.rotation.x = -Math.PI / 2; floor.position.y = -4.7; floor.visible = false; s.add(floor);
  const fade = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ map: ctex(256, 256, (g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, 10, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(3,3,6,.35)'); gr.addColorStop(.35, 'rgba(3,3,6,.8)'); gr.addColorStop(1, 'rgba(3,3,6,1)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); }), transparent: true, depthWrite: false }));
  fade.rotation.x = -Math.PI / 2; fade.position.y = -4.68; s.add(fade);
  const beams = new THREE.Group(); s.add(beams);
  for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 40), new THREE.MeshBasicMaterial({ map: beamTex, color: i % 2 ? 0xbfe9ff : 0xe8dcff, transparent: true, opacity: .16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    b.geometry.translate(0, 20, 0); b.position.set(-9 + i * 3.6, -4.7, -9); b.userData.i = i; beams.add(b); }
  const dust = sprites(90, 3, 0xcfe6ff, THREE.AdditiveBlending, .5); s.add(dust);
  scenes.pres = { s, cam, bloom: [.28, .4, .93], update(t) {
    const k = eio(P(t, 0, 2.7));
    cam.position.set(lerp(-9, 0, k), lerp(-1.5, 2.2, k), lerp(44, 60, k)); cam.lookAt(0, lerp(-1.6, -2.4, k), 0);
    logo.rotation.y = lerp(-.75, 0, expo(P(t, 0, 2.2))); logo.position.y = lerp(-1.2, 0, expo(P(t, 0, 1.6)));
    beams.children.forEach(b => { const i = b.userData.i; b.rotation.z = Math.sin(t * .9 + i * 1.3) * .5 + (i - 2.5) * .08; b.rotation.y = .3 * Math.sin(t * .6 + i); b.material.opacity = .14 * eo(P(t, .2, 1.2)); });
    dust.children.forEach(d => { const u = d.userData; d.position.set((u.a - .5) * 22, ((u.b + t * .03 * (1 + u.c)) % 1) * 16 - 5, (u.d - .5) * 14); const sc = .05 + u.e * .12; d.scale.set(sc, sc, 1); });
  } };
}

// ================================================================== S2 · In a world… (embers, haze)
{
  const s = mkScene(bgTex('#2a1308', '#050204')), cam = mkCam(40);
  const embers = sprites(160, 11, 0xff9a3c); s.add(embers);
  scenes.world = { s, cam, bloom: [1.1, .6, .2], update(t) {
    cam.position.set(0, 0, lerp(14, 11, t / 2)); cam.lookAt(0, 0, 0);
    embers.children.forEach(e => { const u = e.userData; const y = ((u.b + t * (.05 + u.c * .08)) % 1) * 22 - 11;
      e.position.set((u.a - .5) * 16 + Math.sin(t * 1.3 + u.d * 9) * .4, y, (u.d - .5) * 12); const sc = .04 + u.e * .16; e.scale.set(sc, sc, 1); e.material.opacity = .5 + .5 * Math.sin(t * 5 + u.e * 20); });
  } };
}

// ================================================================== spreadsheet city (S3, S6, S7)
const cityMat = new THREE.ShaderMaterial({
  uniforms: { uFog: { value: new THREE.Color(0x060b1c) }, uTime: { value: 0 } },
  vertexShader: `varying vec3 vW;varying vec3 vN;void main(){vec4 w=modelMatrix*instanceMatrix*vec4(position,1.);vW=w.xyz;vN=normalize(mat3(modelMatrix*instanceMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}`,
  fragmentShader: `uniform vec3 uFog;uniform float uTime;varying vec3 vW;varying vec3 vN;
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    void main(){
      vec2 uv=abs(vN.x)>.5?vW.zy:vW.xy; if(abs(vN.y)>.5)uv=vW.xz;
      vec2 cs=vec2(1.3,.62); vec2 cell=floor(uv/cs); vec2 f=fract(uv/cs);
      float line=step(f.x,.07)+step(f.y,.1);
      float r=h(cell+floor(vW.x*.13)*7.);
      vec3 base=vec3(.05,.08,.16);
      vec3 col=mix(base,vec3(.35,.5,.75),clamp(line,0.,1.)*.4);
      float blink=step(.5,fract(r*9.+uTime*.35));
      if(r>.88) col=mix(col,vec3(.2,.9,.5)*1.35,.8);               // green highlighted cells
      else if(r>.8) col=mix(col,vec3(.8,.87,1.)*.75,.6);            // white data cells
      else if(r>.70&&blink>.5) col=vec3(1.,.35,.35)*1.6;            // stray red #REF!
      if(abs(vN.y)>.5) col=base*.7;
      col*=.62+.38*max(dot(vN,normalize(vec3(.4,.7,.6))),0.);
      float d=length(vW-cameraPosition); col=mix(col,uFog,clamp((d-35.)/160.,0.,.95));
      gl_FragColor=vec4(col,1.);}`,
});
function makeCity(seed = 5) {
  const g = new THREE.Group(), r = rng(seed), blds = [];
  for (let z = 6; z > -300; z -= 7 + r() * 5) for (const side of [-1, 1]) {
    const w = 4 + r() * 5, d = 4 + r() * 5, hgt = 14 + r() * 58, x = side * (6.5 + w / 2 + r() * 2);
    blds.push([x, hgt / 2 - 2, z, w, hgt, d]);
    if (r() > .35) { const w2 = 5 + r() * 6, h2 = 20 + r() * 70; blds.push([side * (18 + r() * 14), h2 / 2 - 2, z - 3, w2, h2, 5 + r() * 5]); }
  }
  const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), cityMat, blds.length), m = new THREE.Matrix4();
  blds.forEach(([x, y, z, w, h, d], i) => { m.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(w, h, d)); inst.setMatrixAt(i, m); });
  g.add(inst);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(13, 700), new THREE.MeshStandardMaterial({ color: 0x0a0d18, roughness: .35, metalness: .5, envMap: ENV, envMapIntensity: .6 })); road.rotation.x = -Math.PI / 2; road.position.set(0, -2, -300); g.add(road);
  for (const x of [-4.2, 4.2]) { const l = new THREE.Mesh(new THREE.PlaneGeometry(.12, 700), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x2ee07a).multiplyScalar(2.2) })); l.rotation.x = -Math.PI / 2; l.position.set(x, -1.98, -300); g.add(l); }
  const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'varying vec3 vP;void main(){float y=normalize(vP).y;vec3 c=mix(vec3(.05,.1,.24),vec3(.01,.02,.06),smoothstep(-.05,.6,y));gl_FragColor=vec4(c,1.);}' }));
  g.add(sky); g.add(stars(900, 700, 21, 2.4));
  return g;
}
function makePapers(n, seed) {
  const geo = new THREE.PlaneGeometry(.9, 1.16); const mat = new THREE.MeshStandardMaterial({ map: paperTex, side: THREE.DoubleSide, roughness: .6 });
  const inst = new THREE.InstancedMesh(geo, mat, n); const r = rng(seed); inst.userData.p = Array.from({ length: n }, () => [r(), r(), r(), r(), r(), r()]); return inst;
}
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
function setInst(inst, i, x, y, z, rx, ry, rz, sc) { _e.set(rx, ry, rz); _q.setFromEuler(_e); _m.compose(_v.set(x, y, z), _q, _s.set(sc, sc, sc)); inst.setMatrixAt(i, _m); }

// ================================================================== S3 · where small businesses run on… 47 SPREADSHEETS
{
  const s = mkScene(), cam = mkCam(42); s.fog = null;
  lights(s, 1.6, .5, 0x7df0ff, 1.2);
  s.add(makeCity(5));
  const papers = makePapers(140, 9); s.add(papers);
  let n47;
  scenes.city = { s, cam, bloom: [.55, .45, .78], init() {
    n47 = new THREE.Mesh((() => { const g = new TextGeometry('47', { font: FONT, size: 5.2, depth: 1.6, curveSegments: 12, bevelEnabled: true, bevelThickness: .25, bevelSize: .14, bevelSegments: 6 }); g.center(); return g; })(), gold);
    s.add(n47);
  }, update(t) {
    cityMat.uniforms.uTime.value = t;
    const k = eio(P(t, 0, 3.3));
    cam.position.set(Math.sin(t * .6) * .8, lerp(46, 7, k), lerp(26, -34, k)); cam.lookAt(0, lerp(4, 9, k), lerp(-40, -110, k));
    // 47 slams in
    const sl = P(t, 1.85, 2.2), b = back(clamp(sl * 1.2));
    n47.visible = t > 1.85;
    n47.position.copy(cam.position).add(new THREE.Vector3(0, .6, -19).applyQuaternion(cam.quaternion)); n47.quaternion.copy(cam.quaternion);
    n47.rotateX(-.12); n47.rotateY(lerp(.9, -.08, eo(sl)) + Math.sin(t * 1.5) * .04);
    const sc = lerp(3.2, 1, eo(sl)) * (1 + .05 * pulse(t, 2.25, .15)); n47.scale.setScalar(sc);
    papers.userData.p.forEach((p, i) => { const f = ((p[0] + t * (.18 + p[1] * .2)) % 1);
      const burst = t > 2.0 ? eo(P(t, 2.0, 3.2)) : 0;
      setInst(papers, i, (p[2] - .5) * 18 + Math.sin(t * 2 + i) * .6, lerp(60, 2, f), lerp(-20, -90, p[3]) + burst * (p[4] - .5) * 6,
        t * (1 + p[4] * 3) + i, t * (1.5 + p[5]) + i, t * .7 + i, .9 + p[5] * .7); });
    papers.instanceMatrix.needsUpdate = true;
    papers.position.copy(cam.position).multiplyScalar(0).setZ(cam.position.z * .0);
  } };
}

// ================================================================== S4 · the villains (4 × 1s)
const VIL = [
  { key: 'inv', title: 'THE OVERDUE INVOICE', sub: 'It will never, ever pay itself.', bg: ['#b1121f', '#2a0206'], rim: 0xff7a7a },
  { key: 'chat', title: 'THE GROUP CHAT', sub: '312 unread. None of them urgent.', bg: ['#1f4fe0', '#030a2a'], rim: 0x9ec5ff },
  { key: 'env', title: 'REPLY-ALL', sub: "It CC'd everyone. Again.", bg: ['#d49a1c', '#2a1703'], rim: 0xffe29a },
  { key: 'ref', title: 'THE #REF! ERROR', sub: 'Nobody knows where it came from.', bg: ['#6d24d6', '#12032b'], rim: 0xd8a8ff },
];
VIL.forEach((v, i) => {
  const s = mkScene(bgTex(...v.bg)), cam = mkCam(34);
  lights(s, 2.6, .7, v.rim, 2.4);
  const sp = new THREE.SpotLight(0xffffff, 60, 30, .5, .6); sp.position.set(0, 8, 10); s.add(sp);
  const floaters = sprites(40, 30 + i, 0xffffff, THREE.AdditiveBlending, .25); s.add(floaters);
  scenes['vil' + i] = { s, cam, bloom: [.45, .5, .85], init() {
    const ch = v.key === 'inv' ? makeInvoice() : v.key === 'chat' ? makeChat() : v.key === 'env' ? makeEnvelope() : makeRef();
    if (ch.userData.paid) ch.userData.paid.visible = false; if (ch.userData.tape) { ch.userData.tape.visible = false; ch.userData.badge.visible = false; }
    if (ch.userData.smile && v.key === 'inv') ch.userData.smile.visible = false;
    s.add(ch); this.ch = ch;
  }, update(t) {
    const ch = this.ch, u = ch.userData, pop = back(P(t, 0, .32));
    cam.position.set(Math.sin(t * .8) * .4, .4, lerp(17.5, 15.5, t)); cam.lookAt(0, -.3, 0);
    ch.scale.setScalar(Math.max(.001, pop)); ch.position.y = -.6 + Math.sin(t * 6) * .08; ch.rotation.y = Math.sin(t * 2.2) * .18; ch.rotation.z = Math.sin(t * 3.1) * .05;
    const lx = Math.sin(t * 3 + i) * .6, ly = .15 + Math.cos(t * 2.3) * .2; u.E.forEach(e => { e.userData.look(lx, ly); e.userData.blink(pulse(t, .62, .06)); });
    if (u.b1 && v.key === 'inv') { u.b1.rotation.z = -.38; u.b2.rotation.z = .38; }
    if (u.over) { const st = P(t, .18, .3); u.over.scale.setScalar(lerp(2.4, 1, eo(st))); u.over.material.opacity = clamp(st * 3); }
    (u.tags || []).forEach((tg, k) => { tg.position.z = .6 + Math.sin(t * 4 + k) * .15; tg.rotation.z = Math.sin(t * 2 + k * 2) * .1; tg.scale.setScalar(Math.max(.001, back(P(t, .15 + k * .08, .45 + k * .08)))); });
    if (u.flap) u.flap.rotation.x = -Math.abs(Math.sin(t * 5)) * .25;
    floaters.children.forEach(f => { const q = f.userData; f.position.set((q.a - .5) * 14, (q.b - .5) * 20 + t * q.c, -3 - q.d * 6); f.scale.setScalar(.05 + q.e * .15); });
  } };
});

// ================================================================== S5 · It was chaos (fireball, paper storm)
{
  const s = mkScene(bgTex('#6a2106', '#120302')), cam = mkCam(40);
  lights(s, 1.5, .6, 0xff9a3c, 3);
  const fire = sprites(60, 51, 0xff6a10, THREE.AdditiveBlending, .5); s.add(fire);
  const core = sprites(14, 52, 0xffc35a, THREE.AdditiveBlending, .6); s.add(core);
  const smoke = sprites(40, 53, 0x2a1208, THREE.NormalBlending, .55); s.add(smoke);
  const papers = makePapers(120, 55); s.add(papers);
  scenes.chaos = { s, cam, bloom: [.8, .6, .6], init() {
    const mini = [makeChat(), makeEnvelope(), makeRef()]; mini.forEach((m, i) => { m.scale.setScalar(.55); if (m.userData.tape) { m.userData.tape.visible = false; m.userData.badge.visible = false; } s.add(m); });
    this.mini = mini;
  }, update(t) {
    const sh = Math.max(0, 1 - t / 1.2) * .35;
    cam.position.set(Math.sin(t * 60) * sh, Math.cos(t * 53) * sh, lerp(16, 13, t / 1.7)); cam.lookAt(0, 0, 0);
    const ex = eo(P(t, 0, 1.2));
    fire.children.forEach(f => { const q = f.userData, d = ex * (2 + q.a * 5); f.position.set(Math.cos(q.b * 6.3) * d, Math.sin(q.b * 6.3) * d * .8 - 1 + t * q.c, (q.d - .5) * 3);
      const sc = (1 + q.e * 2.2) * (0.4 + ex); f.scale.set(sc, sc, 1); f.material.opacity = (1 - P(t, .5 + q.c, 1.7)) * .35; });
    core.children.forEach(f => { const q = f.userData, d = ex * q.a * 2; f.position.set(Math.cos(q.b * 6.3) * d, Math.sin(q.b * 6.3) * d - .5, 1); const sc = 1.2 + q.e * 1.8; f.scale.set(sc, sc, 1); f.material.opacity = (1 - P(t, .2, 1.1)) * .5; });
    smoke.children.forEach(f => { const q = f.userData, d = ex * (3 + q.a * 6); f.position.set(Math.cos(q.b * 6.3) * d, Math.sin(q.b * 6.3) * d * .7 + t * .8, -2); const sc = 3 + q.e * 4; f.scale.set(sc, sc, 1); });
    papers.userData.p.forEach((p, i) => { const d = ex * (4 + p[0] * 14); const a = p[1] * 6.3;
      setInst(papers, i, Math.cos(a) * d, Math.sin(a) * d * .9 - 1, (p[2] - .5) * 8 + ex * 3, t * (3 + p[3] * 6), t * (2 + p[4] * 5), i, .7 + p[5] * .6); });
    papers.instanceMatrix.needsUpdate = true;
    this.mini.forEach((m, k) => { const a = [2.3, .5, -1.3][k], d = ex * 5.5; m.position.set(Math.cos(a) * d, Math.sin(a) * d - .5, 1.5); m.rotation.set(t * 3 + k, t * 4 + k * 2, t * 2);
      m.userData.E.forEach(e => { e.userData.look(Math.sin(t * 20 + k), Math.cos(t * 17 + k)); }); });
  } };
}

// ================================================================== S6/S7 · It's a plane! → Unyxo swoops in and lands
{
  const s = mkScene(), cam = mkCam(40);
  lights(s, 1.8, .55, 0x7df0ff, 1.6);
  s.add(makeCity(8));
  const plane = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: 0xf2f4f8, roughness: .35, metalness: .3, envMap: ENV });
  const fus = new THREE.Mesh(new THREE.CapsuleGeometry(.55, 6, 8, 24), white); fus.rotation.z = Math.PI / 2; plane.add(fus);
  const wing = new THREE.Mesh(new RoundedBoxGeometry(1.6, .14, 7.6, 2, .06), white); wing.rotation.y = .25; plane.add(wing);
  const tail = new THREE.Mesh(new RoundedBoxGeometry(.9, 1.6, .12, 2, .05), white); tail.position.set(-3.1, .8, 0); plane.add(tail);
  const stab = new THREE.Mesh(new RoundedBoxGeometry(.7, .1, 2.6, 2, .04), white); stab.position.set(-3.1, .2, 0); plane.add(stab);
  const nav = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xff3b30, blending: THREE.AdditiveBlending, depthWrite: false })); nav.position.set(0, 0, 3.8); plane.add(nav);
  s.add(plane);
  const hero = makeHero(); s.add(hero);
  const trail = sprites(40, 71, 0x9ee9ff); s.add(trail);
  const wave = new THREE.Mesh(new THREE.TorusGeometry(1, .08, 12, 90), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x7df0ff).multiplyScalar(3), transparent: true })); wave.rotation.x = -Math.PI / 2; s.add(wave);
  const dust = sprites(60, 72, 0xbfd8ff, THREE.AdditiveBlending, .6); s.add(dust);
  const rays = new THREE.Group(); for (let i = 0; i < 12; i++) { const b = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 34), new THREE.MeshBasicMaterial({ map: beamTex, color: 0xcfe8ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    b.geometry.translate(0, 17, 0); b.rotation.z = (i - 5.5) * .2; rays.add(b); } s.add(rays);
  scenes.sky = { s, cam, bloom: [.6, .5, .72], init() {
    const bub = makeChat(), env = makeEnvelope(); [bub, env].forEach((c, k) => { c.scale.setScalar(.5); c.position.set(k ? 1.6 : -1.6, -1.1, -4); if (c.userData.tape) { c.userData.tape.visible = false; c.userData.badge.visible = false; c.userData.tags.forEach(x => x.visible = false); } else c.userData.tags.forEach(x => x.visible = false); s.add(c); });
    this.watchers = [bub, env];
  }, update(t, T0) {
    cityMat.uniforms.uTime.value = T0;
    const tt = T0 - T.sky[0];                       // 0 → 4.8s across sky + hero
    const land = 3.05;                              // hero touches down (≈ 19.05s)
    // camera: street level looking up the canyon at the sky, then the landing close-up
    const up = 1 - eio(P(tt, 1.2, 1.8)), sh = pulse(tt, land + .05, .35) * .45;
    cam.position.set(Math.sin(tt * 30) * sh, lerp(3.2, 1, up) + Math.cos(tt * 27) * sh, lerp(9, 6, up));
    cam.lookAt(0, lerp(3.2, 30, up), lerp(-30, -60, up));
    // It's a plane!
    plane.visible = tt < 1.8; plane.position.set(lerp(-40, 40, tt / 1.8), 42, -58); plane.rotation.set(0, 0, .05);
    nav.material.opacity = (Math.sin(tt * 18) > 0) ? 1 : .2; nav.scale.setScalar(1.2);
    this.watchers.forEach((c, k) => { c.visible = tt < 1.8; c.userData.E.forEach(e => { e.userData.look(lerp(-.6, .6, tt / 1.8), .9); e.userData.blink(pulse(tt, .9 + k * .2, .06)); }); c.position.y = -1.1 + Math.abs(Math.sin(tt * 8)) * .15; });
    // hero: dives down the canyon toward camera, then lands
    const fly = P(tt, 1.4, land), fe = ei(fly);
    hero.visible = tt > 1.4;
    const hz = lerp(-160, -13, fe), hy = lerp(30, 1.4, eio(fly)) + (tt > land ? Math.sin((tt - land) * 2) * .06 + .08 * expo(P(tt, land, land + .6)) : 0);
    hero.position.set(Math.sin(fly * 5) * 2 * (1 - fly), hy, hz);
    hero.rotation.set(lerp(-.9, 0, expo(P(tt, land - .25, land + .2))), 0, Math.sin(fly * 6) * .12 * (1 - fly));
    hero.userData.cape.userData.update(T0, tt > land ? .8 : 1.6, tt > land ? 1 - expo(P(tt, land, land + .7)) : 1);
    hero.scale.setScalar(.62);
    trail.children.forEach((p, k) => { const q = p.userData, age = (k / 40) * .5; const tp = clamp(fly - age);
      p.position.set(Math.sin(tp * 5) * 2 * (1 - tp) + (q.a - .5) * .6, lerp(30, 1.4, eio(tp)) + (q.b - .5) * .6, lerp(-160, -13, ei(tp)));
      p.material.opacity = (tt > 1.4 && tt < land + .3 ? .6 : 0) * (1 - k / 40); p.scale.setScalar(.6 + q.c); });
    // touchdown: shockwave, dust, god rays
    const w = P(tt, land, land + .9); wave.visible = w > 0 && w < 1; wave.position.set(0, -1.95, -13); wave.scale.setScalar(.5 + expo(w) * 14); wave.material.opacity = 1 - w;
    dust.children.forEach(d => { const q = d.userData, e = expo(P(tt, land, land + 1.4)); d.visible = tt > land; const a = q.a * 6.3, r = e * (2 + q.b * 7);
      d.position.set(Math.cos(a) * r, -1.9 + e * q.c * 1.6, -13 + Math.sin(a) * r * .5); d.scale.setScalar(.4 + q.d * 1.2); d.material.opacity = .55 * (1 - e); });
    rays.position.set(0, -1, -17); rays.children.forEach((b, k) => { b.material.opacity = .22 * expo(P(tt, land, land + .5)) * (.7 + .3 * Math.sin(T0 * 2 + k)); b.rotation.z = (k - 5.5) * .2 + Math.sin(T0 * .5) * .05; });
  } };
}

// ================================================================== S8 · One system. (dark) → Bookings? Invoices? The group chat? (clean white studio)
{
  const s = mkScene(0x050507), cam = mkCam(30);
  lights(s, 1.4, .4);
  const st = stars(500, 300, 81, 2); st.position.y = -40; s.add(st);
  const tab = new THREE.Group();
  tab.add(new THREE.Mesh(new RoundedBoxGeometry(5.6, 8.5, .32, 6, .3), new THREE.MeshPhysicalMaterial({ color: 0x1c1c20, metalness: .8, roughness: .28, envMap: ENV, envMapIntensity: 1.2, clearcoat: 1 })));
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 8.0), new THREE.MeshBasicMaterial({ map: dashTex, toneMapped: false })); screen.position.z = .17; tab.add(screen);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 8.0), new THREE.MeshPhysicalMaterial({ transparent: true, opacity: .08, roughness: 0, metalness: 0, envMap: ENV, envMapIntensity: 1.2 })); glass.position.z = .18; tab.add(glass);
  s.add(tab);
  scenes.one = { s, cam, bloom: [.35, .4, .9], update(t) {
    cam.position.set(Math.sin(t * .5) * 1.5, .4, 24); cam.lookAt(0, -1.2, 0);
    tab.position.y = -2.6 + Math.sin(t * 1.3) * .08; tab.rotation.set(lerp(.5, .06, expo(P(t, 0, 1.1))), lerp(-.8, -.12, expo(P(t, 0, 1.1))) + Math.sin(t * .7) * .05, 0);
    tab.scale.setScalar(lerp(.7, 1, expo(P(t, 0, 1.1))));
  } };

  const w = mkScene(0xeeeef2), wc = mkCam(32);
  w.add(new THREE.HemisphereLight(0xffffff, 0xd8d8e0, 1.6));
  const k = new THREE.DirectionalLight(0xffffff, 2.2); k.position.set(3, 8, 10); w.add(k);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: 0xeeeef2, roughness: .9 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -4.4; w.add(floor);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(9, 3), new THREE.MeshBasicMaterial({ map: ctex(256, 128, (g, W2, H2) => { const gr = g.createRadialGradient(W2 / 2, H2 / 2, 5, W2 / 2, H2 / 2, W2 / 2); gr.addColorStop(0, 'rgba(0,0,0,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W2, H2); }), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -4.38; w.add(shadow);
  const tab2 = tab.clone(); tab2.children[1] = tab2.children[1].clone(); const scr2 = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 8.0), new THREE.MeshBasicMaterial({ map: calTex, toneMapped: false })); scr2.position.z = .17;
  tab2.remove(tab2.children[1]); tab2.remove(tab2.children[1]); tab2.add(scr2); tab2.children[0].material = new THREE.MeshPhysicalMaterial({ color: 0xe3e4e8, metalness: .9, roughness: .22, envMap: ENV, envMapIntensity: 1, clearcoat: 1 });
  w.add(tab2);
  scenes.white = { s: w, cam: wc, bloom: [0, .3, 1], init() {
    this.inv = makeInvoice(); this.chat = makeChat(); this.chat.userData.tags.forEach(x => x.visible = false);
    this.inv.userData.over.visible = false; this.inv.userData.mouth.visible = false;
    w.add(this.inv, this.chat);
  }, update(t) {
    // t: seconds since Bookings? (22.3)
    wc.position.set(0, .6, 24); wc.lookAt(0, -1, 0);
    const seg = t < 1.0 ? 0 : t < 1.95 ? 1 : 2, lt = seg === 0 ? t : seg === 1 ? t - 1.0 : t - 1.95;
    tab2.visible = seg === 0; this.inv.visible = seg === 1; this.chat.visible = seg === 2;
    const pop = back(P(lt, 0, .3));
    if (seg === 0) { redraw(calTex, expo(P(lt, .05, .72))); tab2.position.set(0, -1.7, 0); tab2.rotation.set(.05, Math.sin(t) * .08 - .1, 0); tab2.scale.setScalar(Math.max(.001, pop) * .8); }
    if (seg === 1) { const u = this.inv.userData; this.inv.position.set(0, -.8, 0); this.inv.scale.setScalar(Math.max(.001, pop) * 1.05); this.inv.rotation.y = Math.sin(lt * 2) * .12;
      const sl = P(lt, .28, .4); u.paid.visible = lt > .28; u.paid.scale.setScalar(lerp(2.6, 1, eo(sl))); u.paid.material.opacity = clamp(sl * 3);
      u.smile.visible = lt > .4; u.b1.rotation.z = lt > .4 ? .25 : -.35; u.b2.rotation.z = lt > .4 ? -.25 : .35;
      u.E.forEach(e => { e.userData.look(0, lt > .4 ? .25 : 0); e.userData.blink(lt > .4 ? .45 : 0); }); this.inv.position.y += lt > .4 ? Math.abs(Math.sin(lt * 9)) * .12 : 0; }
    if (seg === 2) { const u = this.chat.userData; this.chat.position.set(0, -.6, 0); this.chat.scale.setScalar(Math.max(.001, pop) * .95); this.chat.rotation.y = Math.sin(lt * 2) * .1;
      const tp = P(lt, .22, .34); u.tape.visible = lt > .22; u.tape.scale.set(lerp(2.2, 1, eo(tp)), lerp(2.2, 1, eo(tp)), 1); u.mouth.visible = lt < .22;
      const bp = back(P(lt, .45, .7)); u.badge.visible = lt > .45; u.badge.scale.setScalar(Math.max(.001, bp));
      u.E.forEach(e => { e.userData.look(Math.sin(lt * 6) * .5, -.1); e.userData.blink(pulse(lt, .6, .06)); }); }
  } };
}

// ================================================================== S9 · reviews (gold bokeh) and S10 · end card
{
  const s = mkScene(0x040406), cam = mkCam(40);
  const bok = sprites(70, 91, 0xffc766, THREE.AdditiveBlending, .5); s.add(bok);
  scenes.rev = { s, cam, bloom: [.8, .6, .3], update(t) { cam.position.set(0, 0, 12); cam.lookAt(0, 0, 0);
    bok.children.forEach(b => { const q = b.userData; b.position.set((q.a - .5) * 14, (q.b - .5) * 22 + t * .3 * q.c, -2 - q.d * 10); b.scale.setScalar(.3 + q.e * 1.4); b.material.opacity = .15 + .25 * q.c; }); } };
}
{
  const s = mkScene(0x030305), cam = mkCam(30);
  lights(s, 1.5, .3);
  const hero = makeHero(); s.add(hero);
  const spot = new THREE.Mesh(new THREE.PlaneGeometry(14, 40), new THREE.MeshBasicMaterial({ map: beamTex, color: 0xdfe9ff, transparent: true, opacity: .14, blending: THREE.AdditiveBlending, depthWrite: false })); spot.geometry.translate(0, -20, 0); spot.rotation.z = Math.PI; spot.position.set(0, 16, -6); s.add(spot);
  const embers = sprites(80, 101, 0xffc080, THREE.AdditiveBlending, .6); s.add(embers);
  scenes.end = { s, cam, bloom: [.32, .45, .9], update(t, T0) {
    const k = expo(P(t, 0, 1.6));
    cam.position.set(0, lerp(-2, 0, k), lerp(52, 56, t / 2.8)); cam.lookAt(0, -7.4, 0);
    hero.position.set(0, lerp(-1.5, 0, k), 0); hero.rotation.y = lerp(.5, 0, k) + Math.sin(t * .8) * .04; hero.userData.cape.userData.update(T0, 1.25, 0);
    embers.children.forEach(e => { const q = e.userData; e.position.set((q.a - .5) * 20, ((q.b + t * .05 * (1 + q.c)) % 1) * 30 - 18, -4 + (q.d - .5) * 8); e.scale.setScalar(.05 + q.e * .18); });
  } };
}

// ------------------------------------------------------------------ overlay (typography) per scene
const layers = [...document.querySelectorAll('.layer')];
const show = id => layers.forEach(l => l.style.display = l.id === id ? 'block' : 'none');
const world = $('world'); world.innerHTML = [...'IN A|WORLD…'].map(c => c === '|' ? '<br>' : `<span style="display:inline-block">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
const worldSpans = [...world.querySelectorAll('span')];
world.classList.add('glow-g'); worldSpans.forEach(sp => sp.classList.add('gold'));
function fadeIn(el, t, a, d = .45, y = 26) { const k = expo(P(t, a, a + d)); el.style.opacity = k; el.style.transform = `translateY(${(1 - k) * y}px)`; el.style.filter = `blur(${(1 - k) * 10}px)`; return k; }
function slam(el, t, a, d = .28) { const k = P(t, a, a + d); el.style.opacity = clamp(k * 2.5); el.style.transform = `scale(${lerp(1.9, 1, eo(k)) * (1 + .04 * pulse(t, a + d + .04, .1))})`; }
function fitLine(el, size, max) { el.style.fontSize = size + 'px'; el.style.whiteSpace = 'nowrap'; const r = document.createRange(); r.selectNodeContents(el); const w = r.getBoundingClientRect().width; if (w > max) el.style.fontSize = (size * max / w) + 'px'; }
function keep(el, extra = '') { el.style.transform = (el.style.transform || '') + extra; }

// ------------------------------------------------------------------ frame
function frame(t) {
  let sc, lt = 0, flash = 0, black = 0, whip = 0;
  const inR = r => t >= r[0] && t < r[1];
  if (inR(T.card)) { show('L0'); sc = null; black = Math.max(1 - P(t, 0, .25), P(t, 2.05, 2.3));
    const c = $('card'); const k = expo(P(t, .1, .7)); c.style.opacity = k; c.style.transform = `scale(${lerp(.96, 1, k)})`; }
  else if (inR(T.pres)) { sc = scenes.pres; lt = t - T.pres[0]; show('L1'); fadeIn($('pres1'), lt, 1.1, .7, 0); fadeIn($('pres2'), lt, 1.6, .6, 0); black = Math.max(1 - P(lt, 0, .5), P(lt, 2.35, 2.7)); }
  else if (inR(T.world)) { sc = scenes.world; lt = t - T.world[0]; show('L2');
    worldSpans.forEach((s, i) => { const k = expo(P(lt, .15 + i * .07, .75 + i * .07)); s.style.opacity = k; s.style.transform = `translateY(${(1 - k) * 30}px) scale(${lerp(1.3, 1, k)})`; s.style.filter = `blur(${(1 - k) * 12}px)`; });
    world.style.transform = `scale(${lerp(1, 1.06, lt / 2)})`; black = P(lt, 1.8, 2.0) * .8; }
  else if (inR(T.city)) { sc = scenes.city; lt = t - T.city[0]; show('L3');
    const w = $('where'); fadeIn(w, lt, .2, .55); w.style.opacity = (+w.style.opacity) * (1 - P(lt, 1.65, 1.85));
    const l = $('sp47lbl'); slam(l, lt, 1.95, .22); flash = pulse(lt, 1.87, .12) * .55; }
  else if (inR(T.vil)) { lt = t - T.vil[0]; const i = Math.min(3, Math.floor(lt)); sc = scenes['vil' + i]; lt -= i; show('L4');
    const v = VIL[i]; if ($('vt').textContent !== v.title) { $('vt').textContent = v.title; fitLine($('vt'), 92, 960); } $('vs').textContent = v.sub; slam($('vt'), lt, .05, .22); fadeIn($('vs'), lt, .2, .3, 14);
    whip = Math.max(1 - P(lt, 0, .14), i < 3 ? P(lt, .88, 1) : 0) * (i === 0 ? (lt < .5 ? 0 : 1) : 1); }
  else if (inR(T.chaos)) { sc = scenes.chaos; lt = t - T.chaos[0]; show('L5'); slam($('chaos'), lt, .25, .3); flash = pulse(lt, .02, .12) * .8; }
  else if (inR(T.sky) || inR(T.hero)) { sc = scenes.sky; lt = t - T.sky[0]; show(lt < 1.6 ? 'L6' : lt > 3.25 ? 'L7' : '');
    if (lt < 1.6) { slam($('plane'), lt, .55, .22); $('plane').style.opacity = +$('plane').style.opacity * (1 - P(lt, 1.35, 1.55)); }
    if (lt > 3.25) fadeIn($('entered'), lt, 3.3, .5, 20);
    whip = pulse(lt, 1.6, .14) * .7; flash = pulse(lt, 3.07, .12) * .75 + P(lt, 4.55, 4.8); }
  else if (t >= T.one[0] && t < 22.3) { sc = scenes.one; lt = t - T.one[0]; show('L8'); $('q').style.display = 'none'; $('qs').style.display = 'none'; $('one').style.display = 'block';
    $('one').classList.add('silver'); fadeIn($('one'), lt, .35, .6); flash = 1 - P(lt, 0, .35); }
  else if (t >= 22.3 && t < T.one[1]) { sc = scenes.white; lt = t - 22.3; show('L8'); $('one').style.display = 'none'; const q = $('q'), qs = $('qs'); q.style.display = 'block'; qs.style.display = 'block';
    const seg = lt < 1.0 ? 0 : lt < 1.95 ? 1 : 2, st = [0, 1.0, 1.95][seg];
    q.textContent = ['Bookings?', 'Invoices?', 'The group chat?'][seg]; qs.textContent = ['Booked while you sleep.', 'Paid. On time.', 'Muted. Finally.'][seg];
    slam(q, lt, st + .02, .2); fadeIn(qs, lt, st + .3, .3, 12); whip = (seg > 0 ? pulse(lt, st, .1) : 0) * .8; flash = seg === 0 ? (1 - P(lt, 0, .18)) * .9 : 0; }
  else if (inR(T.rev)) { sc = scenes.rev; lt = t - T.rev[0]; show('L9');
    [...$('stars').children].forEach((s, i) => { const k = back(P(lt, .1 + i * .09, .4 + i * .09)); s.style.opacity = clamp(k * 3); s.style.transform = `scale(${Math.max(0, k)})`; });
    fadeIn($('r1'), lt, .7, .5); fadeIn($('r2'), lt, 1.2, .5); black = Math.max(1 - P(lt, 0, .3), 0); }
  else { sc = scenes.end; lt = t - T.end[0]; show('L10');
    [['uword', .5], ['usys', .8], ['uss', 1.05], ['usoon', 1.25], ['ucred', 1.45], ['ubtn', 1.65], ['udis', 1.85]].forEach(([id, a]) => fadeIn($(id), lt, a, .55, 18));
    $('ubtn').style.transform += ' translateX(-50%)'; $('ubtn').style.left = '50%';
    black = 1 - P(lt, 0, .35); }

  // DOM flash / fade
  $('fx-flash').style.opacity = clamp(flash); $('fx-black').style.opacity = clamp(black);
  if (!sc) { renderer.setClearColor(0x000000, 1); renderer.clear(); return; }
  sc.update(lt, t);
  renderPass.scene = sc.s; renderPass.camera = sc.cam;
  [bloom.strength, bloom.radius, bloom.threshold] = sc.bloom;
  filmPass.uniforms.uTime.value = t; filmPass.uniforms.uWhip.value = whip;
  composer.render();
}

// ------------------------------------------------------------------ boot
const fx = document.createElement('div'); fx.innerHTML = '<div id="fx-flash" style="position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none"></div><div id="fx-black" style="position:absolute;inset:0;background:#000;opacity:0;pointer-events:none"></div>';
$('stage').append(...fx.children);
window.ready = (async () => {
  await document.fonts.load('900 64px "Inter Display"'); await document.fonts.load('700 64px Cinzel'); await document.fonts.load('900 64px Cinzel'); await document.fonts.ready;
  [invoiceTex, teethTex, tapeTex, badgeTex, dashTex, calTex].forEach(t => redraw(t));
  FONT = new FontLoader().parse(await (await fetch('vendor/fonts/helvetiker_bold.typeface.json')).json());
  Object.values(scenes).forEach(s => s.init && s.init());
  // warm-up: compile every scene once
  for (const s of Object.values(scenes)) { renderer.compile(s.s, s.cam); }
  frame(0);
  return true;
})();
window.renderFrame = t => frame(t);
if (!navigator.webdriver) {
  const q = new URLSearchParams(location.search);
  window.ready.then(() => { if (q.has('t')) frame(+q.get('t')); else { let t0; const loop = ts => { t0 ??= ts; frame(((ts - t0) / 1000) % 30); requestAnimationFrame(loop); }; requestAnimationFrame(loop); } });
}
