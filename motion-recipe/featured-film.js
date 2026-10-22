/* 既存の作品集とは独立した、名刺用の代表作プレーヤー。 */
(() => {
  const video = document.getElementById("featured-video");
  const sound = document.getElementById("featured-sound");
  const status = document.getElementById("featured-status");
  const fallback = document.getElementById("featured-fallback");
  if (!video || !sound || !status || !fallback) return;

  function update() {
    const audible = !video.muted && video.volume > 0;
    sound.setAttribute("aria-pressed", String(audible && !video.ended));
    if (video.ended) sound.textContent = "もう一度、音つきで見る";
    else if (video.paused) sound.textContent = "最初から再生する（音つき）";
    else sound.textContent = audible ? "音を消す" : "音つきで最初から見る";
  }

  sound.addEventListener("click", () => {
    if (!video.paused && !video.ended && !video.muted && video.volume > 0) {
      video.muted = true;
      status.textContent = "無音で再生しています。";
      update();
      return;
    }
    // 音を出す本人のタップと同じイベント内で、先頭へ戻して再生する。
    video.currentTime = 0;
    video.muted = false;
    video.volume = 1;
    video.play().then(() => {
      status.textContent = "音つきで再生しています。1分34秒の仲間紹介ムービー。";
      update();
    }).catch(() => {
      status.textContent = "動画の再生ボタンを押すと再生できます。";
      update();
    });
  });

  ["play", "pause", "volumechange", "ended"].forEach((event) => video.addEventListener(event, update));
  function failed() {
    fallback.hidden = false;
    status.textContent = "YouTube版、または下の作品集からご覧ください。";
    update();
  }
  video.addEventListener("error", failed);
  video.querySelector("source").addEventListener("error", failed);
  document.getElementById("featured-gallery").addEventListener("click", () => video.pause());
  document.addEventListener("play", (event) => {
    if (event.target instanceof HTMLMediaElement && event.target !== video && !event.target.muted) video.pause();
  }, true);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) video.pause();
  });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) video.pause();
    }, { threshold: 0 }).observe(video);
  }

  // 作品の直リンク・画面外では音も動画も動かさない。自動再生を拒む端末でも操作を残す。
  const rect = video.getBoundingClientRect();
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || rect.bottom <= 0 || rect.top >= window.innerHeight) {
    video.autoplay = false;
    video.pause();
    update();
  } else {
    video.muted = true;
    video.play().catch(() => {
      status.textContent = "ボタンを押すと、音つきで再生できます。";
      update();
    });
  }
})();
