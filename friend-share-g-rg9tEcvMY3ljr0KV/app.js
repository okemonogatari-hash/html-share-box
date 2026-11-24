(() => {
  const chips = [...document.querySelectorAll('.chip')];
  chips.forEach((chip) => chip.addEventListener('click', () => {
    const on = chip.classList.contains('lit');
    chips.forEach((c) => c.classList.remove('lit'));
    if (!on) chips.filter((c) => c.dataset.s === chip.dataset.s).forEach((c) => c.classList.add('lit'));
  }));

  document.querySelectorAll('.hop').forEach((pic) => {
    pic.addEventListener('click', () => {
      pic.classList.remove('go');
      void pic.offsetWidth;
      pic.classList.add('go');
    });
  });

  const tabs = [...document.querySelectorAll('[data-tab]')];
  const panels = [...document.querySelectorAll('[data-panel]')];
  const show = (name) => {
    tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === name)));
    panels.forEach((p) => { p.hidden = p.dataset.panel !== name; });
  };
  tabs.forEach((t) => t.addEventListener('click', () => show(t.dataset.tab)));
  if (tabs.length) show('min');

  const items = [...document.querySelectorAll('template[data-pic]')];
  const text = document.getElementById('dailytext');
  const art = document.querySelector('.dailyart img');
  const btn = document.getElementById('dailybtn');
  let last = -1;
  if (btn) btn.addEventListener('click', () => {
    let i = Math.floor(Math.random() * items.length);
    if (i === last) i = (i + 1) % items.length;
    last = i;
    const item = items[i];
    text.textContent = item.innerHTML;
    art.src = `assets/${item.dataset.pic}.webp`;
    art.width = Number(item.dataset.w);
    art.height = Number(item.dataset.h);
    art.alt = '今日のふたりの絵';
    btn.textContent = '🍒 もう一回引く';
  });
})();
