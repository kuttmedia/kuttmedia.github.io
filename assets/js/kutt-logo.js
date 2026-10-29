// KUTT logo reveal — every frame is a pure function of time t (seconds),
// so the preview and the exported frames are identical.
// Copy of kutt-reveal/reveal.js: the home page draws the white website loop live from it
// (sharper and much lighter on phones than a video). Copy it again after changing the animation.

(() => {
// ---------- Logo geometry (from Kutt-Logo-SVG/kutt-wordmark-black.svg, viewBox 2000x930) ----------
const COL = { purple: '#7C3AED', black: '#0B0A0F', white: '#FFFFFF' };

const LETTERS = [
  { id: 'K', x0: 137.93, x1: 524.55, d: 'M137.93 661.42L137.93 317.88L255.23 317.88L255.23 569.37L225.45 544.18L396.3 317.88L519.97 317.88L245.14 661.42ZM302.83 503.39L389.86 435.12L524.55 661.42L390.79 661.42Z' },
  { id: 'U', x0: 543.31, x1: 904.3, d: 'M661.53 503.83C661.53 516.37 663.71 527.11 668.13 536.17C672.6 545.16 679.36 552.09 688.52 557C697.68 561.85 709.46 564.3 723.8 564.3C738.47 564.3 750.36 561.96 759.52 557.21C768.68 552.47 775.39 545.54 779.7 536.38C783.95 527.22 786.08 516.37 786.08 503.83L786.08 317.88L904.3 317.88L904.3 510.26C904.3 542.33 896.77 570.25 881.83 594.08C866.89 617.91 845.9 636.45 818.85 649.75C791.8 663 760.12 669.66 723.8 669.66C687.76 669.66 656.24 663 629.19 649.75C602.2 636.45 581.1 617.91 565.99 594.08C550.89 570.25 543.31 542.33 543.31 510.26L543.31 317.88L661.53 317.88Z' },
  { id: 'T1', x0: 1111.73, x1: 1477.3, d: 'M1235.41 368.7L1353.63 368.7L1353.63 661.42L1235.41 661.42ZM1111.73 317.88L1477.3 317.88L1477.3 423.23L1111.73 423.23Z' },
  { id: 'T2', x0: 1496.5, x1: 1862.07, d: 'M1620.17 368.7L1738.39 368.7L1738.39 661.42L1620.17 661.42ZM1496.5 317.88L1862.07 317.88L1862.07 423.23L1496.5 423.23Z' },
].map(l => ({ ...l, path: new Path2D(l.d), cx: (l.x0 + l.x1) / 2 }));
// Outer outlines (union of each letter's overlapping sub-shapes) so the edge light only traces real edges.
const tOutline = x => `M${x} 317.88L${x + 365.57} 317.88L${x + 365.57} 423.23L${x + 241.9} 423.23L${x + 241.9} 661.42L${x + 123.68} 661.42L${x + 123.68} 423.23L${x} 423.23Z`;
const OUTLINES = {
  K: 'M137.93 661.42L137.93 317.88L255.23 317.88L255.23 504.74L396.3 317.88L519.97 317.88L405.35 461.15L524.55 661.42L390.79 661.42L331.03 554.05L245.14 661.42Z',
  T1: tOutline(1111.73), T2: tOutline(1496.5),
};
LETTERS.forEach(l => { l.edge = OUTLINES[l.id] ? new Path2D(OUTLINES[l.id]) : l.path; });

const TRI = new Path2D('M927.64 137.93L1102.14 137.93L1014.89 236.09Z');
const HEAD_X = 1014.89, HEAD_CY = 170, LINE_TOP = 225.18, LINE_BOT = 792.29, LINE_W = 32.72;
const TOP = 317.88, BASE = 661.42, MID_Y = (TOP + BASE) / 2;
// Closing the gap the playhead sits in gives the "plain KUTT" spacing (matches the tight wordmark).
const GAP_SHIFT = ((1111.73 - 904.3) - (1496.5 - 1477.3)) / 2; // ≈ 94.1
const SIDE = [-1, -1, 1, 1]; // K,U go left on the split; T,T go right

// ---------- Timeline (seconds) ----------
const S = { s1: 0, s2: 3.8, s3: 6.8, s4: 9.6, cut: 14.5, s6: 15.8, end: 18.7 };
const SHOTS = [
  { name: 'Edge light · K', t: S.s1 },
  { name: 'Edge light · T', t: S.s2 },
  { name: 'Pull back', t: S.s3 },
  { name: 'Playhead hover', t: S.s4 },
  { name: 'The cut', t: S.cut - 0.3 },
  { name: 'Hold', t: S.s6 },
];
const DURATION = S.end;

// ---------- Easing ----------
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const ease = {
  inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  inOutCubic: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outCubic: t => 1 - Math.pow(1 - t, 3),
  outQuart: t => 1 - Math.pow(1 - t, 4),
  outExpo: t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  outBack: (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
  // Eases in, then holds a constant speed to the end, so the camera is still moving when we cut.
  inCruise: (t, a = 0.35) => { const v = 1 / (1 - a / 2); return t < a ? (v * t * t) / (2 * a) : v * (t - a / 2); },
  inOutQuint: t => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2),
};
// Damped spring 0→1 over normalised time (settles by t≈1).
const spring = (t, bounce = 0.35) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.exp(-6 * t) * Math.cos(t * Math.PI * (1.5 + bounce * 4)) * (1 - t * 0.2));

// ---------- Scene state at time t ----------
function stateAt(t) {
  const st = {
    letters: LETTERS.map((l, i) => ({ dx: -SIDE[i] * GAP_SHIFT, dy: 0 })),
    head: null, line: null, flash: 0,
    sweep: null, // light band { ax, ay, bx, by, pos, width, alpha }
    cam: { x: 1000, y: MID_Y, zoom: 1, rot: 0, blur: 0 },
    shake: [0, 0], bars: 0, fade: 0, exposure: 0, vignette: 0.2, dark: 0,
  };

  // Shot 1 — extreme close-up, camera tilted, drifting along the K's diagonal edge as light runs down it.
  if (t < S.s2) {
    const p = prog(t, S.s1, S.s2);
    const e = ease.inCruise(p, 0.5);
    const kx = -GAP_SHIFT * -1; // K sits shifted right in the tight layout
    st.cam = { x: lerp(500, 300, e) + kx, y: lerp(350, 600, e), zoom: lerp(4.4, 5.0, e), rot: lerp(-0.42, -0.36, e), blur: 16 * (1 - ease.outCubic(prog(t, 0.2, 2.2))) };
    st.sweep = { ax: 560 + kx, ay: 270, bx: 200 + kx, by: 720, pos: lerp(-0.05, 1.05, ease.inOutSine(prog(t, 0.6, S.s2))), width: 0.12, alpha: 1 };
    st.fade = 1 - ease.inOutSine(prog(t, 0, 1.8));
    st.bars = 1; st.vignette = 0.42; st.dark = 1;
  }
  // Shot 2 — opposite tilt, gliding along the top bars of the Ts, light racing the camera.
  else if (t < S.s3) {
    const p = prog(t, S.s2, S.s3);
    const e = p; // already moving off the cut, still moving into the next one
    const tx = -GAP_SHIFT;
    st.cam = { x: lerp(1160, 1720, e) + tx, y: lerp(300, 345, e), zoom: lerp(3.3, 3.6, e), rot: lerp(0.2, 0.15, e), blur: 9 * (1 - ease.outCubic(prog(t, S.s2, S.s2 + 1))) };
    st.sweep = { ax: 1000 + tx, ay: 200, bx: 1900 + tx, by: 420, pos: lerp(-0.1, 1.1, ease.inOutSine(prog(t, S.s2 + 0.2, S.s3))), width: 0.12, alpha: 1 };
    st.exposure = 0.55 * Math.exp(-(t - S.s2) / 0.09);
    st.bars = 1; st.vignette = 0.38; st.dark = 0.9;
  }
  // Shot 3 — pull back to the full word, untilting, letterbox opens, a light sweep crosses the logo.
  else if (t < S.s4) {
    const p = prog(t, S.s3, S.s4);
    const e = ease.outQuart(p);
    st.cam = { x: lerp(1080, 1000, e), y: lerp(470, MID_Y, e), zoom: lerp(1.75, 1.0, e), rot: lerp(-0.12, 0, e), blur: 4 * (1 - ease.outCubic(prog(t, S.s3, S.s3 + 0.6))) };
    st.sweep = { ax: 0, ay: 150, bx: 2000, by: 850, pos: lerp(-0.15, 1.15, ease.inOutSine(prog(t, S.s3 + 0.5, S.s4 - 0.2))), width: 0.1, alpha: 0.9 };
    st.exposure = 0.45 * Math.exp(-(t - S.s3) / 0.09);
    st.bars = 1 - ease.inOutCubic(prog(t, S.s3 + 0.6, S.s3 + 2.0));
    st.vignette = lerp(0.34, 0.2, e);
    // Lights come up: low-key close-ups → bright studio white.
    st.dark = 0.9 * (1 - ease.inOutCubic(prog(t, S.s3 + 0.15, S.s3 + 1.6)));
  }

  // Shots 4–6 — the playhead.
  if (t >= S.s4) {
    const T0 = S.s4 + 0.35; // triangle appears
    const appear = spring(prog(t, T0, T0 + 0.9), 0.25);
    // Path: in over the K, glide right across U → T, ease back to the gap, then hold under tension.
    let hx;
    if (t < T0 + 0.6) hx = 330;
    else if (t < T0 + 2.2) hx = lerp(330, 1370, ease.inOutSine(prog(t, T0 + 0.6, T0 + 2.2)));
    else hx = lerp(1370, HEAD_X, ease.inOutSine(prog(t, T0 + 2.2, T0 + 4.0)));
    const hoverOn = t < S.cut;
    const bob = hoverOn ? Math.sin((t - T0) * 2.6) * 7 * (1 - prog(t, S.cut - 0.8, S.cut - 0.3)) : 0;
    // Anticipation: lift just before the cut, then slam down.
    const lift = -18 * ease.outCubic(prog(t, S.cut - 0.35, S.cut - 0.05)) * (1 - ease.outExpo(prog(t, S.cut - 0.05, S.cut + 0.12)));
    st.head = { x: hx, y: bob + lift, scale: lerp(0.25, 1, appear), alpha: clamp(appear * 1.4) };

    // Letters feel the playhead: pushed away from it and pressed down slightly underneath it.
    const hoverW = clamp(appear) * (1 - prog(t, S.cut, S.cut + 0.08));
    const sigma = 190, A = 22;
    const tension = ease.inOutCubic(prog(t, T0 + 3.5, S.cut - 0.1)) * hoverW;
    LETTERS.forEach((l, i) => {
      const base = st.letters[i];
      const d = (l.cx + base.dx - hx) / sigma;
      // tanh is monotonic in position, so a gap can only widen — letters never touch.
      base.dx += A * Math.tanh(d) * hoverW;
      base.dy += 7 * Math.exp(-d * d) * hoverW * (1 - tension);
      // Tension right before the split: the gap letters strain apart and tremble.
      // Each half moves as one block so the K–U and T–T gaps hold; only the gap letters tremble.
      base.dx += SIDE[i] * 12 * tension + Math.sin(t * 70 + i * 1.7) * 1.4 * tension * (i === 1 || i === 2 ? 1 : 0);
    });

    // The cut: line drops from the triangle, the word splits.
    const drop = prog(t, S.cut, S.cut + 0.32);
    if (t >= S.cut) st.line = { bottom: lerp(LINE_TOP, LINE_BOT, ease.outBack(drop, 1.1)) };
    const split = spring(prog(t, S.cut + 0.08, S.cut + 1.1), 0.3);
    LETTERS.forEach((l, i) => { st.letters[i].dx += SIDE[i] * GAP_SHIFT * split; });
    st.flash = t >= S.cut + 0.1 ? Math.exp(-(t - S.cut - 0.1) / 0.16) : 0;

    // Camera: stays centred and level from the pull-back, gentle push-in, punch on the cut, slow settle on the hold.
    const push = ease.inOutSine(prog(t, S.s4, S.cut));
    const punch = t >= S.cut + 0.1 ? 0.05 * Math.exp(-(t - S.cut - 0.1) / 0.25) * Math.cos((t - S.cut) * 9) : 0;
    const hold = ease.inOutSine(prog(t, S.s6 - 0.4, S.end));
    st.cam = {
      x: 1000,
      y: MID_Y,
      zoom: lerp(1.0, 1.14, push) * (1 - 0.12 * ease.inOutCubic(prog(t, S.cut + 0.3, S.s6 + 0.4))) + punch + hold * 0.025,
      rot: 0, blur: 0,
    };
    const sk = t >= S.cut + 0.1 ? 7 * Math.exp(-(t - S.cut - 0.1) / 0.1) : 0;
    st.shake = [Math.sin(t * 91) * sk, Math.cos(t * 77) * sk];
    if (t >= S.s6) st.sweep = { ax: 0, ay: 150, bx: 2000, by: 850, pos: lerp(-0.15, 1.15, ease.inOutSine(prog(t, S.s6 + 0.3, S.s6 + 1.9))), width: 0.09, alpha: 0.7 };
    st.vignette = 0.2;
  }
  return st;
}

// ---------- Website loop: centred word, no camera moves, no shine, transparent ----------
// Plain KUTT → playhead pops in, hovers, cuts, holds → line retracts, word closes, playhead leaves → plain KUTT.
// The first and last frames are identical, so it loops seamlessly.
const LOOP = { T0: 0.5, hold: 3.0, end: 10 };
LOOP.cut = LOOP.T0 + 4.55;
LOOP.out = LOOP.cut + LOOP.hold;
const LOOP_SHOTS = [
  { name: 'Plain KUTT', t: 0 },
  { name: 'Playhead in', t: LOOP.T0 },
  { name: 'The cut', t: LOOP.cut - 0.3 },
  { name: 'Hold', t: LOOP.cut + 1.2 },
  { name: 'Playhead out', t: LOOP.out },
];
function loopStateAt(t) {
  const { T0, cut, out } = LOOP;
  const st = {
    loop: true,
    letters: LETTERS.map((l, i) => ({ dx: -SIDE[i] * GAP_SHIFT, dy: 0 })),
    head: null, line: null, flash: 0, sweep: null,
    cam: { x: 1000, y: 465, zoom: 1, rot: 0, blur: 0 }, shake: [0, 0], // centre of the logo box
  };
  const appear = spring(prog(t, T0, T0 + 0.9), 0.25);
  if (t < T0) return st;

  let hx;
  if (t < T0 + 0.6) hx = 330;
  else if (t < T0 + 2.2) hx = lerp(330, 1370, ease.inOutSine(prog(t, T0 + 0.6, T0 + 2.2)));
  else hx = lerp(1370, HEAD_X, ease.inOutSine(prog(t, T0 + 2.2, T0 + 4.0)));
  const bob = t < cut ? Math.sin((t - T0) * 2.6) * 7 * (1 - prog(t, cut - 0.8, cut - 0.3)) : 0;
  const lift = -18 * ease.outCubic(prog(t, cut - 0.35, cut - 0.05)) * (1 - ease.outExpo(prog(t, cut - 0.05, cut + 0.12)));

  // Exit: line pulls back up into the triangle, the word closes, then the triangle shrinks away.
  const retract = ease.inOutCubic(prog(t, out, out + 0.4));
  const close = ease.inOutCubic(prog(t, out + 0.15, out + 0.85));
  const leave = ease.inOutCubic(prog(t, out + 0.45, out + 0.85));
  if (leave >= 1) return st;
  st.head = { x: hx, y: bob + lift, scale: lerp(0.25, 1, appear) * (1 - 0.8 * leave), alpha: clamp(appear * 1.4) * (1 - leave) };

  const hoverW = clamp(appear) * (1 - prog(t, cut, cut + 0.08));
  const sigma = 190, A = 22;
  const tension = ease.inOutCubic(prog(t, T0 + 3.5, cut - 0.1)) * hoverW;
  LETTERS.forEach((l, i) => {
    const base = st.letters[i];
    const d = (l.cx + base.dx - hx) / sigma;
    base.dx += A * Math.tanh(d) * hoverW;
    base.dy += 7 * Math.exp(-d * d) * hoverW * (1 - tension);
    base.dx += SIDE[i] * 12 * tension + Math.sin(t * 70 + i * 1.7) * 1.4 * tension * (i === 1 || i === 2 ? 1 : 0);
  });

  const drop = prog(t, cut, cut + 0.32);
  if (t >= cut && retract < 1) st.line = { bottom: lerp(LINE_TOP, LINE_BOT, ease.outBack(drop, 1.1) * (1 - retract)) };
  const split = spring(prog(t, cut + 0.08, cut + 1.1), 0.3) * (1 - close);
  LETTERS.forEach((l, i) => { st.letters[i].dx += SIDE[i] * GAP_SHIFT * split; });
  st.flash = t >= cut + 0.1 ? Math.exp(-(t - cut - 0.1) / 0.16) : 0;
  return st;
}

const VARIANTS = {
  reveal: { stateAt, duration: DURATION, shots: SHOTS, size: [1920, 1080], alpha: false },
  loop: { stateAt: loopStateAt, duration: LOOP.end, shots: LOOP_SHOTS, size: [1920, 780], alpha: true, slug: 'kutt-logo-loop' },
  // Same loop, white letters for dark backgrounds (matches kutt-wordmark-white.svg; playhead stays purple).
  loopWhite: { stateAt: loopStateAt, duration: LOOP.end, shots: LOOP_SHOTS, size: [1920, 780], alpha: true, ink: COL.white, darkPreview: true, slug: 'kutt-logo-loop-white' },
};

// ---------- Rendering ----------
function bandGradient(ctx, sw, colorFn, widthScale = 1) {
  const g = ctx.createLinearGradient(sw.ax, sw.ay, sw.bx, sw.by);
  const w = sw.width * widthScale;
  // Smooth bell-shaped band; sample it so stops outside 0..1 still shape the visible part.
  const band = p => { const d = Math.abs(p - sw.pos) / w; return d >= 1 ? 0 : Math.pow(Math.cos(d * Math.PI / 2), 2); };
  const pts = new Set([0, 1]);
  for (let i = -6; i <= 6; i++) { const p = sw.pos + (w * i) / 6; if (p > 0 && p < 1) pts.add(p); }
  [...pts].sort((a, b) => a - b).forEach(p => g.addColorStop(p, colorFn(band(p) * sw.alpha)));
  return g;
}

let grain = null;
function makeGrain() {
  grain = [];
  let seed = 1337;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let n = 0; n < 8; n++) {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d'); const img = g.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (rnd() - 0.5) * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    g.putImageData(img, 0, 0); grain.push(c);
  }
}

function drawLetters(ctx, st, fn) {
  LETTERS.forEach((l, i) => { ctx.save(); ctx.translate(st.letters[i].dx, st.letters[i].dy); fn(l, i); ctx.restore(); });
}

// Draw the world (background + logo) into ctx. k = output px per 1920-wide virtual px.
function drawScene(ctx, st, k) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const c = st.cam;
  // The loop frames the word tightly (logo box x 40–1960, y 60–870, room for the glow) instead of the 16:9 reveal framing.
  const scale = st.loop ? Math.min(W / 1920, H / 810) * c.zoom : 0.62 * 1920 / 1724 * c.zoom * k; // logo units → output px
  const px = v => v * k / scale; // screen px (virtual) → logo units

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (st.loop) {
    ctx.clearRect(0, 0, W, H);
    ctx.translate(W / 2, H / 2); ctx.scale(scale, scale); ctx.translate(-c.x, -c.y);
    ctx.fillStyle = st.ink || COL.black;
    drawLetters(ctx, st, l => ctx.fill(l.path));
    drawPlayhead(ctx, st, k);
    return;
  }

  // Background: soft studio white with a hotspot behind the logo.
  const mix = (a, b) => { const m = st.dark; return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], m))).join(',')})`; };
  ctx.fillStyle = mix([236, 234, 242], [12, 11, 17]); ctx.fillRect(0, 0, W, H);
  const bg = ctx.createRadialGradient(W * 0.5, H * 0.42, 0, W * 0.5, H * 0.45, W * 0.75);
  bg.addColorStop(0, mix([255, 255, 255], [74, 66, 96])); bg.addColorStop(0.55, mix([247, 246, 250], [34, 30, 46])); bg.addColorStop(1, mix([226, 223, 234], [10, 9, 14]));
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // Camera.
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.translate(W / 2 + st.shake[0] * k, H / 2 + st.shake[1] * k);
  ctx.rotate(c.rot);
  ctx.scale(scale, scale);
  ctx.translate(-c.x, -c.y);

  // Soft contact shadow (2D depth, no extrusion).
  ctx.save();
  ctx.filter = `blur(${18 * k}px)`;
  ctx.fillStyle = 'rgba(40, 24, 80, 0.16)';
  drawLetters(ctx, st, l => { ctx.translate(px(6), px(16)); ctx.fill(l.path); });
  ctx.restore();

  // Letter fill with a faint vertical sheen so the black isn't dead flat.
  const fill = ctx.createLinearGradient(0, TOP, 0, BASE);
  fill.addColorStop(0, '#1A1724'); fill.addColorStop(0.5, '#0B0A0F'); fill.addColorStop(1, '#100E16');
  ctx.fillStyle = fill;
  drawLetters(ctx, st, l => ctx.fill(l.path));

  // Edge light: an inner rim that catches the moving light band, plus a broad faint sheen.
  if (st.sweep) {
    const rim = bandGradient(ctx, st.sweep, a => `rgba(255,255,255,${a})`);
    const rimTint = bandGradient(ctx, st.sweep, a => `rgba(196,168,255,${a * 0.9})`, 1.8);
    const sheen = bandGradient(ctx, st.sweep, a => `rgba(220,205,255,${a * 0.13})`, 2.2);
    drawLetters(ctx, st, l => {
      ctx.save(); ctx.clip(l.path);
      ctx.fillStyle = sheen; ctx.fill(l.path);
      ctx.lineJoin = 'round';
      ctx.strokeStyle = rimTint; ctx.lineWidth = px(16); ctx.stroke(l.edge);
      ctx.strokeStyle = rim; ctx.lineWidth = px(5); ctx.stroke(l.edge);
      ctx.restore();
    });
    // Light spill just outside the edge.
    ctx.save();
    ctx.globalCompositeOperation = st.dark > 0.3 ? 'lighter' : 'multiply';
    ctx.filter = `blur(${14 * k}px)`;
    ctx.strokeStyle = bandGradient(ctx, st.sweep, a => `rgba(${st.dark > 0.3 ? '150,110,255' : '200,180,255'},${a * 0.55})`, 1.5);
    ctx.lineWidth = px(14);
    drawLetters(ctx, st, l => ctx.stroke(l.edge));
    ctx.restore();
  }

  // Purple light from the playhead catching the top edges of the letters below it.
  if (st.head && st.head.alpha > 0) {
    const h = st.head;
    const glow = ctx.createRadialGradient(h.x, TOP, 0, h.x, TOP, 260);
    const ga = h.alpha * 0.85 + st.flash;
    glow.addColorStop(0, `rgba(167,120,255,${clamp(ga)})`); glow.addColorStop(1, 'rgba(124,58,237,0)');
    drawLetters(ctx, st, l => {
      ctx.save(); ctx.clip(l.path);
      ctx.strokeStyle = glow; ctx.lineWidth = px(8); ctx.stroke(l.edge);
      ctx.restore();
    });
  }

  // Cut flash: purple bloom along the line + inner edges of the split letters.
  if (st.flash > 0.002) {
    ctx.save();
    // Tall soft ellipse of light centred on the cut.
    ctx.translate(HEAD_X, (LINE_TOP + LINE_BOT) / 2); ctx.scale(0.45, 1.25);
    const fg = ctx.createRadialGradient(0, 0, 0, 0, 0, 340);
    fg.addColorStop(0, `rgba(150,96,255,${0.3 * st.flash})`); fg.addColorStop(1, 'rgba(150,96,255,0)');
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = fg; ctx.fillRect(-340, -340, 680, 680);
    ctx.restore();
  }

  drawPlayhead(ctx, st, k);
}

function drawPlayhead(ctx, st, k) {
  if (st.head && st.head.alpha > 0) {
    const h = st.head;
    ctx.save();
    ctx.globalAlpha = h.alpha;
    ctx.shadowColor = `rgba(124,58,237,${0.45 + st.flash * 0.5})`;
    ctx.shadowBlur = (26 + st.flash * 50) * k;
    ctx.fillStyle = COL.purple;
    if (st.line) {
      const lw = LINE_W, x = h.x - lw / 2;
      ctx.beginPath(); ctx.roundRect(x, LINE_TOP + h.y, lw, Math.max(lw, st.line.bottom - LINE_TOP), lw / 2); ctx.fill();
    }
    ctx.translate(h.x, HEAD_CY + h.y); ctx.scale(h.scale, h.scale); ctx.translate(-HEAD_X, -HEAD_CY);
    ctx.fill(TRI);
    ctx.restore();
    if (st.line && st.flash > 0.01) {
      ctx.save();
      ctx.fillStyle = `rgba(255,255,255,${0.75 * st.flash})`;
      ctx.beginPath(); ctx.roundRect(h.x - 4, LINE_TOP + 10, 8, st.line.bottom - LINE_TOP - 20, 4); ctx.fill();
      ctx.restore();
    }
  }
}

// Screen-space finishing: vignette, letterbox, exposure flash, fade, grain.
function drawFinish(ctx, st, k, frameIndex, withGrain) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.72);
  v.addColorStop(0, 'rgba(18,10,36,0)'); v.addColorStop(1, `rgba(18,10,36,${st.vignette})`);
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  if (st.exposure > 0.002) { ctx.fillStyle = `rgba(255,255,255,${st.exposure})`; ctx.fillRect(0, 0, W, H); }
  if (st.bars > 0.001) {
    const bh = ((H - W / 2.39) / 2) * ease.inOutCubic(st.bars);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bh); ctx.fillRect(0, H - bh, W, bh);
  }
  if (st.fade > 0.001) { ctx.fillStyle = `rgba(0,0,0,${st.fade})`; ctx.fillRect(0, 0, W, H); }
  if (withGrain) {
    if (!grain) makeGrain();
    ctx.save();
    ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.07;
    const n = grain.length, g = grain[(((frameIndex | 0) % n) + n) % n];
    ctx.fillStyle = ctx.createPattern(g, 'repeat');
    ctx.setTransform(k, 0, 0, k, (frameIndex * 97) % 256, (frameIndex * 53) % 256);
    ctx.fillRect(-256, -256, W / k + 512, H / k + 512);
    ctx.restore();
  }
}

const sceneCanvas = document.createElement('canvas');
function renderFrame(ctx, t, { frameIndex = Math.round(t * 30), grain: withGrain = true, finish = true, variant = 'reveal' } = {}) {
  const W = ctx.canvas.width, H = ctx.canvas.height, k = W / 1920;
  const v = VARIANTS[variant];
  const st = v.stateAt(t);
  if (v.ink) st.ink = v.ink;
  if (sceneCanvas.width !== W || sceneCanvas.height !== H) { sceneCanvas.width = W; sceneCanvas.height = H; }
  const sc = sceneCanvas.getContext('2d');
  sc.save(); drawScene(sc, st, k); sc.restore();
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (v.alpha) ctx.clearRect(0, 0, W, H);
  ctx.filter = st.cam.blur > 0.05 ? `blur(${st.cam.blur * k}px)` : 'none';
  ctx.drawImage(sceneCanvas, 0, 0);
  ctx.restore();
  if (finish && !v.alpha) drawFinish(ctx, st, k, frameIndex, withGrain);
  return st;
}

window.KUTT = { renderFrame, stateAt, drawFinish, DURATION, SHOTS, S, VARIANTS, LOOP };
})();
