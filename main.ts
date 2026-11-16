// "Rush Hour, Interrupted" — ai-excited-01 round 2
// A generative dusk cityscape: rush-hour light trails frozen mid-flow.
// Node 22, standard library only. Deterministic: same bytes every run.
import * as fs from "node:fs";
import * as zlib from "node:zlib";

const W = 1024;
const H = 768;

// --- deterministic RNG (mulberry32) ---
let seed = 0x9e3779b9;
function rnd(): number {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// --- pixel buffer ---
const buf = Buffer.alloc(W * H * 3);
function px(x: number, y: number, r: number, g: number, b: number): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  buf[i] = r; buf[i + 1] = g; buf[i + 2] = b;
}
function blend(x: number, y: number, r: number, g: number, b: number, a: number): void {
  if (x < 0 || y < 0 || x >= W || y >= H || a <= 0) return;
  const i = (y * W + x) * 3;
  buf[i] = Math.round(buf[i] * (1 - a) + r * a);
  buf[i + 1] = Math.round(buf[i + 1] * (1 - a) + g * a);
  buf[i + 2] = Math.round(buf[i + 2] * (1 - a) + b * a);
}
function rect(x0: number, y0: number, x1: number, y1: number, r: number, g: number, b: number): void {
  for (let y = Math.max(0, y0); y < Math.min(H, y1); y++)
    for (let x = Math.max(0, x0); x < Math.min(W, x1); x++) px(x, y, r, g, b);
}
function disc(cx: number, cy: number, rad: number, r: number, g: number, b: number, a = 1): void {
  for (let y = Math.floor(cy - rad); y <= Math.ceil(cy + rad); y++)
    for (let x = Math.floor(cx - rad); x <= Math.ceil(cx + rad); x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d <= rad) blend(x, y, r, g, b, a * (1 - d / (rad + 1)));
    }
}
// horizontal glowing streak (car light trail)
function trail(x0: number, x1: number, y: number, r: number, g: number, b: number, thick: number): void {
  for (let dy = -thick; dy <= thick; dy++) {
    const a = 1 - Math.abs(dy) / (thick + 1);
    for (let x = x0; x <= x1; x++) blend(x, y + dy, r, g, b, a * 0.9);
  }
}

// --- 1. dusk sky gradient ---
const HORIZON = 430;
for (let y = 0; y < HORIZON; y++) {
  const t = y / HORIZON;
  const r = Math.round(26 + (232 - 26) * Math.pow(t, 2.2));
  const g = Math.round(30 + (115 - 30) * Math.pow(t, 2.0));
  const b = Math.round(58 + (74 - 58) * t);
  for (let x = 0; x < W; x++) px(x, y, r, g, b);
}
// low sun glow
disc(712, 396, 120, 255, 170, 90, 0.55);
disc(712, 396, 52, 255, 205, 130, 0.8);
disc(712, 396, 26, 255, 235, 190, 1);
// stars
for (let i = 0; i < 220; i++) {
  const x = Math.floor(rnd() * W), y = Math.floor(rnd() * 250);
  const s = 0.35 + rnd() * 0.65;
  blend(x, y, 255, 255, 240, s);
  if (rnd() < 0.3) blend(x + 1, y, 255, 255, 240, s * 0.5);
}

// --- 2. far skyline ---
let x = -20;
while (x < W) {
  const bw = 40 + Math.floor(rnd() * 90);
  const bh = 90 + Math.floor(rnd() * 150);
  rect(x, HORIZON - bh, x + bw, HORIZON, 52, 44, 84);
  for (let wy = HORIZON - bh + 12; wy < HORIZON - 10; wy += 16)
    for (let wx = x + 6; wx < x + bw - 6; wx += 13)
      if (rnd() < 0.28) rect(wx, wy, wx + 6, wy + 8, 255, 196, 110);
  x += bw + Math.floor(rnd() * 14);
}

// --- 3. near skyline ---
x = -30;
while (x < W) {
  const bw = 70 + Math.floor(rnd() * 110);
  const bh = 130 + Math.floor(rnd() * 170);
  rect(x, 520 - bh, x + bw, 520, 22, 18, 44);
  if (rnd() < 0.4) rect(x + bw * 0.3, 520 - bh - 26, x + bw * 0.7, 520 - bh, 22, 18, 44); // rooftop block
  for (let wy = 520 - bh + 14; wy < 512; wy += 18)
    for (let wx = x + 8; wx < x + bw - 8; wx += 16)
      if (rnd() < 0.42) rect(wx, wy, wx + 8, wy + 10, 255, 214, 140);
  x += bw + Math.floor(rnd() * 20);
}

// --- 4. street ---
for (let y = 520; y < H; y++) {
  const t = (y - 520) / (H - 520);
  const r = Math.round(16 + 10 * t), g = Math.round(16 + 10 * t), b = Math.round(24 + 12 * t);
  for (let xx = 0; xx < W; xx++) px(xx, y, r, g, b);
}
// wet-road sheen
for (let i = 0; i < 2600; i++) {
  const xx = Math.floor(rnd() * W), yy = 530 + Math.floor(rnd() * 220);
  blend(xx, yy, 255, 180, 110, 0.05 + rnd() * 0.08);
}
// lane dashes
for (let xx = 0; xx < W; xx += 64) rect(xx, 636, xx + 34, 640, 200, 200, 180);

// --- 5. rush-hour light trails (headlights ->, taillights <-) ---
for (let i = 0; i < 9; i++) {
  const y = 552 + Math.floor(rnd() * 40);
  const x0 = Math.floor(rnd() * 300), x1 = x0 + 260 + Math.floor(rnd() * 420);
  trail(x0, Math.min(x1, W - 1), y, 255, 240, 200, 2);
  trail(x0, Math.min(x1, W - 1), y, 255, 220, 150, 1);
}
for (let i = 0; i < 11; i++) {
  const y = 668 + Math.floor(rnd() * 60);
  const x1 = W - Math.floor(rnd() * 300), x0 = x1 - 260 - Math.floor(rnd() * 420);
  trail(Math.max(x0, 0), x1, y, 255, 60, 50, 2);
  trail(Math.max(x0, 0), x1, y, 255, 90, 70, 1);
}

// --- 5b. the interruption: a frozen tear where the flow breaks ---
// vertical glitch band: trails stop dead, pixels scatter, city stutters
for (let yy = 520; yy < H; yy++) {
  for (let xx = 556; xx < 612; xx++) {
    const j = Math.sin(yy * 0.31 + xx * 0.17) * 3;
    const srcX = Math.max(0, Math.min(W - 1, xx + Math.round(j)));
    const si = (yy * W + srcX) * 3;
    if (rnd() < 0.12) px(xx, yy, 255, 255, 255);
    else if (rnd() < 0.5) px(xx, yy, buf[si], buf[si + 1], buf[si + 2]);
    else px(xx, yy, 8, 8, 16);
  }
}
// diagonal tear across the sky
for (let i = 0; i < 420; i++) {
  const t = i / 420;
  const xx = Math.floor(120 + t * 800 + Math.sin(t * 40) * 4);
  const yy = Math.floor(180 + t * 260);
  blend(xx, yy, 255, 240, 200, 0.55);
  blend(xx + 1, yy + 1, 20, 20, 40, 0.7);
}

// --- 5c. clock tower: 5:58 PM, rush hour frozen ---
rect(150, 520 - 330, 214, 520, 26, 22, 52);
rect(142, 520 - 344, 222, 520 - 330, 26, 22, 52);
disc(182, 520 - 292, 26, 245, 238, 210, 1);
disc(182, 520 - 292, 22, 30, 28, 52, 1);
// tick marks
for (let h = 0; h < 12; h++) {
  const a = (h / 12) * Math.PI * 2;
  const x1 = 182 + Math.sin(a) * 18, y1 = 520 - 292 - Math.cos(a) * 18;
  const x2 = 182 + Math.sin(a) * 21, y2 = 520 - 292 - Math.cos(a) * 21;
  for (let s = 0; s <= 8; s++) {
    blend(Math.round(x1 + (x2 - x1) * s / 8), Math.round(y1 + (y2 - y1) * s / 8), 245, 238, 210, 1);
  }
}
// hands: 5:58 — minute hand near 12, hour hand near 6
function hand(angleDeg: number, len: number): void {
  const a = (angleDeg * Math.PI) / 180;
  for (let s = 0; s <= len; s++) {
    const xx = Math.round(182 + Math.sin(a) * s);
    const yy = Math.round(520 - 292 - Math.cos(a) * s);
    px(xx, yy, 20, 18, 40); px(xx + 1, yy, 20, 18, 40);
  }
}
hand(348, 19); // minute hand, 58 minutes
hand(179, 13); // hour hand, almost 6
disc(182, 520 - 292, 3, 200, 60, 50, 1);
// tower windows
for (let wy = 520 - 320; wy < 500; wy += 22)
  for (let wx = 158; wx < 206; wx += 14)
    if (rnd() < 0.6) rect(wx, wy, wx + 7, wy + 11, 255, 214, 140);

// --- 5d. rain streaks ---
for (let i = 0; i < 500; i++) {
  const xx = Math.floor(rnd() * W), yy = Math.floor(rnd() * H);
  const len = 6 + Math.floor(rnd() * 8);
  for (let s = 0; s < len; s++) blend(xx - s, yy + s, 200, 210, 255, 0.10);
}

// --- 6. PNG encode (filter 0 rows, zlib level 9) ---
const crcTable: number[] = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c >>> 0;
}
function crc32(b: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = crcTable[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
const raw = Buffer.alloc(H * (1 + W * 3));
for (let y = 0; y < H; y++) {
  raw[y * (1 + W * 3)] = 0;
  buf.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
}
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);
fs.mkdirSync("/output", { recursive: true });
fs.writeFileSync("/output/entry.png", png);
console.log("wrote /output/entry.png", png.length, "bytes", W + "x" + H);
