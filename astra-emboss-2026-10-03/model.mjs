export const MAX_CHARACTERS = 42;
export const DEFAULT_TEXT = '光を、\nひと押し。';
export const DEFAULT_STATE = Object.freeze({ text: DEFAULT_TEXT, material: 'gold', relief: 'raised', depth: 0.65, lightX: -0.55, lightY: -0.65 });
const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('ja', { granularity: 'grapheme' }) : null;
export function graphemes(text) { return segmenter ? Array.from(segmenter.segment(text), item => item.segment) : Array.from(text); }
export function normalizeText(raw) {
  const clean = String(raw).slice(0, 2048).replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').replace(/\t/g, ' ');
  let count = 0;
  let lines = 1;
  let result = '';
  for (let char of graphemes(clean)) {
    if (char === '\n') { if (lines < 3) { result += '\n'; lines++; continue; } char = ' '; }
    if (count >= MAX_CHARACTERS) break;
    result += char;
    count++;
  }
  return result;
}
export function characterCount(text) { return graphemes(text).filter(c => c !== '\n').length; }
export function clamp(value, min, max) { return Math.min(max, Math.max(min, Number.isFinite(value) ? value : 0)); }
export function lightVector(x, y) {
  const lx = clamp(x, -1, 1) * 1.65;
  const ly = clamp(y, -1, 1) * 1.65;
  const length = Math.hypot(lx, ly, 0.78);
  return [lx / length, ly / length, 0.78 / length];
}
// Each measured row fits maxWidth. Japanese closing marks stay with the preceding glyph.
export function wrapText(text, maxWidth, measure) {
  const rows = [];
  const closing = /^[、。，．！？：；」』）】〉》ーぁぃぅぇぉゃゅょっァィゥェォャュョッ]$/;
  for (const paragraph of text.split('\n')) {
    let row = '';
    for (const char of graphemes(paragraph)) {
      const candidate = row + char;
      if (row && measure(candidate) > maxWidth) {
        if (closing.test(char) && graphemes(row).length > 1) {
          const parts = graphemes(row);
          const carry = parts.pop();
          rows.push(parts.join(''));
          row = carry + char;
        } else { rows.push(row); row = char; }
      } else row = candidate;
    }
    rows.push(row);
  }
  return rows;
}
