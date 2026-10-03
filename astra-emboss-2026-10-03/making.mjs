const source = document.getElementById('promptSource');
const button = document.getElementById('copyPrompt');
const feedback = document.getElementById('copyFeedback');

button.addEventListener('click', async () => {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(source.textContent.trim());
    button.textContent = 'コピーしました ✓';
    feedback.textContent = 'お使いのAIへ貼り付けて、制作を頼めます。';
  } catch {
    const range = document.createRange();
    range.selectNodeContents(source);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    feedback.textContent = '本文を選択しました。コピーの操作（⌘C / Ctrl+C、または選択メニュー）で持ち帰れます。';
  }
});
