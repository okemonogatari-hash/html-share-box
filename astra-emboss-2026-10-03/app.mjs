import { DEFAULT_STATE, MAX_CHARACTERS, normalizeText, characterCount, clamp } from './model.mjs';
import { EmbossRenderer, MATERIALS } from './renderer.mjs';

const $ = selector => document.querySelector(selector);
const canvas = $('#artwork');
const stage = $('#paperStage');
const input = $('#message');
const saveButton = $('#saveButton');
const state = { ...DEFAULT_STATE };
let renderer;
let frame = null;
let composing = false;
let pointerId = null;
let downloadURL = null;
let revision = 0;

function showError(error) {
  $('#errorMessage').textContent = `表示で問題が起きました。ページを開き直してください。${error?.message ? `（${error.message}）` : ''}`;
  $('#errorMessage').hidden = false;
  saveButton.disabled = true;
  console.error(error);
}
function invalidateSavedImage() {
  revision++;
  if (!$('#saveResult').hidden) $('#saveStatus').textContent = '前に保存した一枚です。今の光で保存するには、もう一度ボタンを押してください。';
}
function updateLightIndicator() {
  const canvasRect = canvas.getBoundingClientRect();
  const stageRect = stage.getBoundingClientRect();
  if (canvasRect.width <= 0 || canvasRect.height <= 0 || stageRect.width <= 0) return;
  const x = canvasRect.left - stageRect.left + (state.lightX + 1) / 2 * canvasRect.width;
  const y = canvasRect.top - stageRect.top + (state.lightY + 1) / 2 * canvasRect.height;
  $('#lightPoint').style.left = `${x}px`;
  $('#lightPoint').style.top = `${y}px`;
}
function renderNow() {
  if (!renderer) return;
  try { renderer.render(state); updateLightIndicator(); } catch (error) { showError(error); }
}
function requestRender() {
  if (frame !== null) return;
  frame = requestAnimationFrame(() => { frame = null; renderNow(); });
}
function syncControls() {
  input.value = state.text;
  $('#charCount').textContent = `${characterCount(state.text)} / ${MAX_CHARACTERS}`;
  document.querySelectorAll('[data-material]').forEach(button => {
    const active = button.dataset.material === state.material;
    button.classList.toggle('selected', active);button.setAttribute('aria-pressed', String(active));
  });
  document.querySelectorAll('[data-relief]').forEach(button => {
    const active = button.dataset.relief === state.relief;
    button.classList.toggle('active', active);button.setAttribute('aria-pressed', String(active));
  });
  $('#depth').value = String(Math.round(state.depth * 100));
  $('#depthValue').value = `${Math.round(state.depth * 100)}%`;
  $('#lightX').value = String(Math.round(state.lightX * 100));
  $('#lightY').value = String(Math.round(state.lightY * 100));
  const material = MATERIALS[state.material];
  $('#materialCaption').textContent = `${material.number} / ${material.name}`;
  canvas.setAttribute('aria-label', `${material.name}に${state.relief === 'raised' ? '浮き出した' : 'くぼませた'}「${state.text.replace(/\n/g, ' ')}」の作品。ドラッグか矢印キーで光を動かせます。`);
}
function changed() { invalidateSavedImage(); syncControls(); requestRender(); }
function updateText() {
  if (composing) return;
  const raw = input.value;
  const next = normalizeText(raw);
  const position = input.selectionStart;
  state.text = next;
  if (next !== raw) {
    input.value = next;
    input.setSelectionRange(Math.min(position, next.length), Math.min(position, next.length));
    $('#inputStatus').textContent = '42文字、3行までに整えました。';
  } else $('#inputStatus').textContent = '';
  // Preserve the caret and native IME behaviour while editing.
  invalidateSavedImage();
  $('#charCount').textContent = `${characterCount(next)} / ${MAX_CHARACTERS}`;
  canvas.setAttribute('aria-label', `${MATERIALS[state.material].name}の作品。「${next.replace(/\n/g, ' ')}」。ドラッグか矢印キーで光を動かせます。`);
  requestRender();
}
input.addEventListener('compositionstart', () => { composing = true; });
input.addEventListener('compositionend', () => { composing = false; updateText(); });
input.addEventListener('input', updateText);
$('#sampleButton').addEventListener('click', () => { state.text = 'おけもん'; changed(); });
document.querySelectorAll('[data-material]').forEach(button => button.addEventListener('click', () => { state.material = button.dataset.material; changed(); }));
document.querySelectorAll('[data-relief]').forEach(button => button.addEventListener('click', () => { state.relief = button.dataset.relief; changed(); }));
$('#depth').addEventListener('input', event => { state.depth = clamp(Number(event.target.value) / 100, 0.1, 1); changed(); });
for (const id of ['lightX', 'lightY']) $('#' + id).addEventListener('input', event => { state[id] = clamp(Number(event.target.value) / 100, -1, 1); changed(); });
$('#resetLight').addEventListener('click', () => { state.lightX = DEFAULT_STATE.lightX; state.lightY = DEFAULT_STATE.lightY; changed(); });
$('#resetButton').addEventListener('click', () => { Object.assign(state, DEFAULT_STATE); changed(); });

function pointerLight(event) {
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;
  state.lightX = clamp((event.clientX - rect.left) / rect.width * 2 - 1, -1, 1);
  state.lightY = clamp((event.clientY - rect.top) / rect.height * 2 - 1, -1, 1);
  changed();
}
canvas.addEventListener('pointerdown', event => {
  if (event.button !== 0 || pointerId !== null) return;
  pointerId = event.pointerId;
  canvas.setPointerCapture(pointerId);
  pointerLight(event);
});
canvas.addEventListener('pointermove', event => { if (event.pointerId === pointerId) pointerLight(event); });
function releasePointer(event) { if (event.pointerId === pointerId) pointerId = null; }
canvas.addEventListener('pointerup', releasePointer);
canvas.addEventListener('pointercancel', releasePointer);
canvas.addEventListener('lostpointercapture', releasePointer);
canvas.addEventListener('keydown', event => {
  const step = event.shiftKey ? 0.2 : 0.06;
  if (event.key === 'ArrowLeft') state.lightX = clamp(state.lightX - step, -1, 1);
  else if (event.key === 'ArrowRight') state.lightX = clamp(state.lightX + step, -1, 1);
  else if (event.key === 'ArrowUp') state.lightY = clamp(state.lightY - step, -1, 1);
  else if (event.key === 'ArrowDown') state.lightY = clamp(state.lightY + step, -1, 1);
  else if (event.key === 'Home') { state.lightX = DEFAULT_STATE.lightX; state.lightY = DEFAULT_STATE.lightY; }
  else return;
  event.preventDefault();changed();
});

saveButton.addEventListener('click', async () => {
  if (!renderer) return;
  saveButton.disabled = true;
  try {
    if (frame !== null) { cancelAnimationFrame(frame); frame = null; }
    renderer.render(state);
    const savedRevision = revision;
    const filename = `hikari-${state.material}-${new Date().toISOString().slice(0, 10)}.png`;
    // toBlob snapshots this canvas at call time: later light changes cannot alter this PNG.
    const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('画像を作れませんでした。')), 'image/png'));
    if (downloadURL) URL.revokeObjectURL(downloadURL);
    downloadURL = URL.createObjectURL(blob);
    const link = $('#downloadLink');
    link.href = downloadURL;link.download = filename;
    $('#saveStatus').textContent = savedRevision === revision ? 'PNGができました。保存が始まらない場合はこちらから。' : 'ボタンを押した時の一枚を保存しました。';
    $('#saveResult').hidden = false;
    const anchor = document.createElement('a');anchor.href = downloadURL;anchor.download = filename;document.body.append(anchor);anchor.click();anchor.remove();
  } catch (error) {
    $('#saveStatus').textContent = `保存できませんでした。もう一度試してください。（${error.message}）`;
    $('#downloadLink').removeAttribute('href');$('#saveResult').hidden = false;
  } finally { saveButton.disabled = false; }
});
window.addEventListener('resize', updateLightIndicator, { passive: true });
window.addEventListener('pagehide', event => { if (!event.persisted && downloadURL) URL.revokeObjectURL(downloadURL); });

async function start() {
  saveButton.disabled = true;
  try {
    // System fonts avoid cross-origin requests. Waiting prevents a fallback-font export race.
    if (document.fonts?.ready) await document.fonts.ready;
    renderer = new EmbossRenderer(canvas);
    syncControls();
    renderer.render(state);
    updateLightIndicator();
    saveButton.disabled = false;
  } catch (error) { showError(error); }
}
start();
