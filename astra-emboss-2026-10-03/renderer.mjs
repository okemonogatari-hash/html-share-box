import { clamp, lightVector, wrapText } from './model.mjs';

export const WIDTH = 1280;
export const HEIGHT = 1024;
export const MATERIALS = Object.freeze({
  cotton: { name: 'コットン紙', number: '02', paper: [236, 230, 215], grain: 2.0 },
  gold: { name: 'シャンパン箔', number: '01', paper: [239, 225, 197], grain: 1.45 },
  black: { name: '宵の黒箔', number: '03', paper: [45, 56, 61], grain: 1.0 }
});
const FONT = '"Hiragino Mincho ProN", "Yu Mincho", YuMincho, "Noto Serif CJK JP", serif';
const N = WIDTH * HEIGHT;

// Repeated box filters soften the mask into a rounded bevel; no external image is sampled.
function blur(source, radius) {
  const temp = new Float32Array(N);
  const dest = new Float32Array(N);
  const divisor = radius * 2 + 1;
  for (let y = 0; y < HEIGHT; y++) {
    const offset = y * WIDTH;
    let sum = 0;
    for (let i = -radius; i <= radius; i++) sum += source[offset + clamp(i, 0, WIDTH - 1)];
    for (let x = 0; x < WIDTH; x++) {
      temp[offset + x] = sum / divisor;
      sum += source[offset + Math.min(WIDTH - 1, x + radius + 1)] - source[offset + Math.max(0, x - radius)];
    }
  }
  for (let x = 0; x < WIDTH; x++) {
    let sum = 0;
    for (let i = -radius; i <= radius; i++) sum += temp[clamp(i, 0, HEIGHT - 1) * WIDTH + x];
    for (let y = 0; y < HEIGHT; y++) {
      dest[y * WIDTH + x] = sum / divisor;
      sum += temp[Math.min(HEIGHT - 1, y + radius + 1) * WIDTH + x] - temp[Math.max(0, y - radius) * WIDTH + x];
    }
  }
  return dest;
}

function spacedText(ctx, text, centerX, baseline, spacing) {
  const letters = Array.from(text);
  const width = letters.reduce((sum, c) => sum + ctx.measureText(c).width, 0) + Math.max(0, letters.length - 1) * spacing;
  let x = centerX - width / 2;
  for (const char of letters) { ctx.fillText(char, x, baseline); x += ctx.measureText(char).width + spacing; }
}

export class EmbossRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    if (!this.ctx) throw new Error('Canvas 2D を開始できませんでした。');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    this.output = this.ctx.createImageData(WIDTH, HEIGHT);
    this.base = null;
    this.currentMaterial = null;
    this.currentText = null;
    this.mask = null;
    this.height = null;
    this.dx = new Float32Array(N);
    this.dy = new Float32Array(N);
    this.active = new Uint32Array(N);
    this.activeCount = 0;
    this.layout = null;
  }

  createPaper(material) {
    const preset = MATERIALS[material];
    const data = new Uint8ClampedArray(N * 4);
    let seed = 730031;
    const random = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296; };
    const dark = material === 'black';
    for (let y = 0; y < HEIGHT; y++) {
      const v = y / HEIGHT;
      for (let x = 0; x < WIDTH; x++) {
        const u = x / WIDTH;
        const grain = (random() - 0.5) * preset.grain * 3.3;
        const fiber = Math.sin(x * 0.68 + y * 0.28) * Math.sin(y * 0.43) * 0.65;
        const illumination = (0.5 - u) * (dark ? 5 : 8) + (0.5 - v) * (dark ? 4 : 7);
        const vignette = -((u - 0.5) ** 2 + (v - 0.5) ** 2) * (dark ? 5 : 7);
        const p = (y * WIDTH + x) * 4;
        for (let c = 0; c < 3; c++) data[p + c] = preset.paper[c] + grain + fiber + illumination + vignette;
        data[p + 3] = 255;
      }
    }
    const paper = document.createElement('canvas');
    paper.width = WIDTH; paper.height = HEIGHT;
    const ctx = paper.getContext('2d', { willReadFrequently: true });
    ctx.putImageData(new ImageData(data, WIDTH, HEIGHT), 0, 0);
    // Sparse fibres are embedded in the paper, including the saved PNG.
    ctx.lineWidth = 0.55;
    for (let i = 0; i < 2800; i++) {
      const x = random() * WIDTH; const y = random() * HEIGHT;
      ctx.strokeStyle = dark ? `rgba(209,223,213,${0.025 + random() * 0.035})` : `rgba(91,75,40,${0.025 + random() * 0.025})`;
      ctx.beginPath();ctx.moveTo(x, y);ctx.lineTo(x + random() * 5 - 2.5, y + random() * 2.8 - 1.4);ctx.stroke();
    }
    // A restrained letterpress frame and colophon keep every phrase feeling like a finished print.
    ctx.strokeStyle = dark ? 'rgba(155,170,157,.15)' : 'rgba(132,113,72,.14)';
    ctx.lineWidth = 0.8;ctx.strokeRect(48.5, 48.5, WIDTH - 97, HEIGHT - 97);
    ctx.fillStyle = dark ? 'rgba(193,203,181,.48)' : 'rgba(130,112,73,.53)';
    ctx.font = '15px Georgia, serif';
    spacedText(ctx, 'H I K A R I   N O   E M B O S S', WIDTH / 2, 926, 1.2);
    ctx.fillStyle = dark ? 'rgba(189,200,178,.28)' : 'rgba(130,112,73,.37)';
    ctx.font = '12px Georgia, serif';
    spacedText(ctx, 'A SMALL IMPRESSION, MADE BY YOU', WIDTH / 2, 951, 1.4);
    this.base = ctx.getImageData(0, 0, WIDTH, HEIGHT).data;
    this.currentMaterial = material;
    paper.width = 1; paper.height = 1;
  }

  createRelief(text) {
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = WIDTH; maskCanvas.height = HEIGHT;
    const ctx = maskCanvas.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let fontSize = 162;
    let rows = [];
    const width = 914;
    for (; fontSize >= 38; fontSize -= 2) {
      ctx.font = `500 ${fontSize}px ${FONT}`;
      rows = wrapText(text, width, s => ctx.measureText(s).width);
      if (rows.length <= 4 && rows.length * fontSize * 1.46 <= 554) break;
    }
    const lineHeight = fontSize * 1.46;
    const centerY = 527;
    rows.forEach((line, i) => ctx.fillText(line, WIDTH / 2, centerY + (i - (rows.length - 1) / 2) * lineHeight));
    this.layout = { fontSize, rows, maxWidth: width, measuredWidths: rows.map(s => ctx.measureText(s).width) };
    // An original sun seal, raised with the same normal field as the text.
    ctx.lineWidth = 1.7;
    ctx.strokeStyle = '#fff';
    ctx.beginPath();ctx.arc(WIDTH / 2, 172, 19, 0, Math.PI * 2);ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6;
      ctx.beginPath();ctx.moveTo(WIDTH / 2 + Math.cos(a) * 27, 172 + Math.sin(a) * 27);ctx.lineTo(WIDTH / 2 + Math.cos(a) * 36, 172 + Math.sin(a) * 36);ctx.stroke();
    }
    const pixels = ctx.getImageData(0, 0, WIDTH, HEIGHT).data;
    this.mask = new Uint8Array(N);
    const source = new Float32Array(N);
    for (let i = 0; i < N; i++) { this.mask[i] = pixels[i * 4 + 3]; source[i] = this.mask[i] / 255; }
    const narrow = blur(blur(source, 2), 2);
    const wide = blur(narrow, 5);
    this.height = wide;
    for (let i = 0; i < N; i++) this.height[i] = narrow[i] * 0.84 + wide[i] * 0.16;
    this.activeCount = 0;
    for (let y = 1; y < HEIGHT - 1; y++) {
      for (let x = 1; x < WIDTH - 1; x++) {
        const i = y * WIDTH + x;
        this.dx[i] = (this.height[i + 1] - this.height[i - 1]) * 0.5;
        this.dy[i] = (this.height[i + WIDTH] - this.height[i - WIDTH]) * 0.5;
        if (this.height[i] > 0.0003 || this.mask[i]) this.active[this.activeCount++] = i;
      }
    }
    this.currentText = text;
    maskCanvas.width = 1; maskCanvas.height = 1;
  }

  render(state) {
    if (!MATERIALS[state.material]) throw new Error('素材を選び直してください。');
    if (state.material !== this.currentMaterial) this.createPaper(state.material);
    if (state.text !== this.currentText) this.createRelief(state.text);
    const [lx, ly, lz] = lightVector(state.lightX, state.lightY);
    const strength = clamp(state.depth, 0.1, 1) * (state.relief === 'pressed' ? -1 : 1) * 14;
    const halfLength = Math.hypot(lx, ly, lz + 1);
    const hx = lx / halfLength, hy = ly / halfLength, hz = (lz + 1) / halfLength;
    const data = this.output.data;
    data.set(this.base);
    const cotton = state.material === 'cotton';
    const black = state.material === 'black';
    const depth = clamp(state.depth, 0.1, 1);
    const pressed = state.relief === 'pressed';
    const band = state.lightX * 0.27 + state.lightY * 0.18;
    for (let n = 0; n < this.activeCount; n++) {
      const i = this.active[n];
      const p = i * 4;
      const h = this.height[i];
      const fill = this.mask[i] / 255;
      let nx = -this.dx[i] * strength;
      let ny = -this.dy[i] * strength;
      const norm = 1 / Math.hypot(nx, ny, 1);
      nx *= norm; ny *= norm;
      const nz = norm;
      const diffuse = Math.max(0, nx * lx + ny * ly + nz * lz);
      const halfDot = Math.max(0, nx * hx + ny * hy + nz * hz);
      const edge = h * (1 - h);
      const relief = (diffuse - lz) * (cotton ? 109 : black ? 57 : 90) - edge * depth * (pressed ? 32 : 18);
      if (cotton) {
        const sheen = Math.pow(halfDot, 18) * 6 - Math.pow(hz, 18) * 6;
        const tone = relief + sheen - fill * depth * (pressed ? 3.6 : 1.8);
        data[p] = this.base[p] + tone;
        data[p + 1] = this.base[p + 1] + tone * 0.98;
        data[p + 2] = this.base[p + 2] + tone * 0.92;
      } else {
        const x = i % WIDTH;
        const y = (i / WIDTH) | 0;
        const wave = Math.sin(y * 0.007 + x * 0.002) * 0.038;
        let sweep = Math.max(0, 1 - Math.abs((x / WIDTH - 0.5) * 0.70 + (y / HEIGHT - 0.5) * 0.47 + wave - band) * 4.5);
        sweep = sweep * sweep * sweep;
        const specular = Math.pow(halfDot, 28) * (black ? 80 : 66);
        const grain = ((i * 2654435761 >>> 24) / 255 - 0.5) * (black ? 8 : 13);
        const crease = Math.sin(x * 0.15 + y * 0.21) * Math.sin(y * 0.042 - x * 0.13) * (black ? 2.4 : 3.2);
        const rim = relief * 1.05 - edge * depth * 21;
        const metal = black
          ? [24 + sweep * 61 + specular + grain + crease + rim, 32 + sweep * 65 + specular + grain + crease + rim, 35 + sweep * 63 + specular + grain + crease + rim]
          : [151 + sweep * 81 + specular + grain + crease + rim, 103 + sweep * 89 + specular * 0.94 + grain + crease + rim, 43 + sweep * 92 + specular * 0.7 + grain + crease + rim];
        for (let c = 0; c < 3; c++) data[p + c] = (this.base[p + c] + relief) * (1 - fill) + metal[c] * fill;
      }
    }
    this.ctx.putImageData(this.output, 0, 0);
  }
}
