(() => {
  const coverScreen = document.getElementById('coverScreen');
  const searchScreen = document.getElementById('searchScreen');
  const cardScreen = document.getElementById('cardScreen');
  const searchResults = document.getElementById('searchResults');
  const searchToggle = document.getElementById('searchToggle');
  const searchBackBtn = document.getElementById('searchBackBtn');
  const searchInput = document.getElementById('searchInput');
  const themeToggle = document.getElementById('themeToggle');
  const themeIconSun = document.getElementById('themeIconSun');
  const themeIconMoon = document.getElementById('themeIconMoon');
  const flipStage = document.getElementById('flipStage');
  const kuralCard = document.getElementById('kuralCard');
  const cardBackBtn = document.getElementById('cardBackBtn');
  const portraitImg = document.getElementById('portraitImg');
  const portraitPlaceholder = document.getElementById('portraitPlaceholder');

  let KURALS = [];
  let cardIndex = 0;
  let isFlipping = false;
  let returnToView = showCover;

  const LEAF_SVG = `<svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M13 22V9"/>
    <path d="M13 13c0-4 3-6.5 7-7-1 4-3 6.5-7 7z"/>
    <path d="M13 17c0-3.2-2.4-5.2-5.6-5.6.8 3.2 2.4 5.2 5.6 5.6z"/>
  </svg>`;

  const HEART_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 20s-7-4.35-9.5-8.8C.7 7.9 2.4 4.5 5.8 4.5c2 0 3.4 1.1 4.2 2.4C10.8 5.6 12.2 4.5 14.2 4.5c3.4 0 5.1 3.4 3.3 6.7C19 15.65 12 20 12 20z"/>
  </svg>`;

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function hideAllScreens() {
    coverScreen.classList.add('hidden');
    searchScreen.classList.add('hidden');
    cardScreen.classList.add('hidden');
  }

  function showCover() {
    hideAllScreens();
    coverScreen.classList.remove('hidden');
  }

  function showSearch() {
    hideAllScreens();
    searchScreen.classList.remove('hidden');
    searchInput.focus();
  }

  /* ---------------- Portrait fallback ---------------- */
  portraitImg.addEventListener('error', () => {
    portraitImg.classList.add('broken');
    portraitPlaceholder.style.display = 'flex';
  });
  portraitImg.addEventListener('load', () => {
    portraitPlaceholder.style.display = 'none';
  });

  /* ---------------- Search ---------------- */

  function renderSearchResults(query) {
    const q = query.trim().toLowerCase();
    if (!q) {
      searchResults.innerHTML = `<div class="empty-state">Type a word, phrase, or a kural number (1–1330).</div>`;
      return;
    }

    let results;
    const asNum = parseInt(q, 10);
    if (!isNaN(asNum) && String(asNum) === q && asNum >= 1 && asNum <= 1330) {
      results = KURALS.filter(k => k.n === asNum);
    } else {
      results = KURALS.filter(k =>
        k.tr.toLowerCase().includes(q) ||
        k.mn.toLowerCase().includes(q) ||
        k.c.toLowerCase().includes(q) ||
        k.cEn.toLowerCase().includes(q) ||
        k.l1.includes(query) ||
        k.l2.includes(query)
      ).slice(0, 100);
    }

    if (!results.length) {
      searchResults.innerHTML = `<div class="empty-state">No kurals found for "${escapeHtml(query)}".<br>Try a different word, or a number from 1–1330.</div>`;
      return;
    }

    searchResults.innerHTML = `<h2 class="chapter-group-label">${results.length} result${results.length === 1 ? '' : 's'}</h2>` +
      results.map(k => `
        <button class="result-row" data-n="${k.n}">
          <div class="result-top">
            <span class="num">Kural ${k.n}</span>
            <span class="chap">${escapeHtml(k.cEn)}</span>
          </div>
          <div class="ta-line">${escapeHtml(k.l1)}</div>
          <div class="en-line">${escapeHtml(k.tr)}</div>
        </button>
      `).join('');

    searchResults.querySelectorAll('.result-row').forEach(btn => {
      btn.addEventListener('click', () => {
        const n = parseInt(btn.dataset.n, 10);
        const idx = KURALS.findIndex(k => k.n === n);
        openCardView(idx, () => { showSearch(); });
      });
    });
  }

  searchToggle.addEventListener('click', () => {
    showSearch();
    renderSearchResults(searchInput.value);
  });

  searchBackBtn.addEventListener('click', showCover);

  let debounceTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => renderSearchResults(searchInput.value), 150);
  });

  /* ---------------- Section rows on cover ---------------- */

  document.querySelectorAll('.section-row').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!KURALS.length) return;
      const sectionNum = parseInt(btn.dataset.section, 10);
      const idx = KURALS.findIndex(k => k.sNum === sectionNum);
      if (idx >= 0) openCardView(idx, showCover);
    });
  });

  /* ---------------- Journal card view ---------------- */

  function cardContentHtml(k) {
    return `
      <div class="ornament-top">
        <span class="ornament-line"></span>${LEAF_SVG}<span class="ornament-line"></span>
      </div>
      <div class="jc-couplet">
        <span class="line">${escapeHtml(k.l1)}</span>
        <span class="line">${escapeHtml(k.l2)}</span>
      </div>
      <div class="jc-tagwrap"><span class="jc-tag">Thirukkural ${k.n}</span></div>
      <p class="jc-translation">${escapeHtml(k.tr)}</p>
      <div class="jc-meaning-tagwrap"><span class="jc-meaning-tag">Meaning:</span></div>
      <p class="jc-meaning">${escapeHtml(k.mn)}</p>
      <div class="ornament-bottom">
        <span class="ornament-line"></span>${HEART_SVG}<span class="ornament-line"></span>
      </div>
    `;
  }

  function openCardView(index, returnFn) {
    if (index < 0 || index >= KURALS.length) return;
    cardIndex = index;
    returnToView = returnFn || returnToView;
    kuralCard.innerHTML = cardContentHtml(KURALS[cardIndex]);
    hideAllScreens();
    cardScreen.classList.remove('hidden');
    window.scrollTo(0, 0);
  }

  function flipTo(newIndex, direction) {
    if (isFlipping || newIndex < 0 || newIndex >= KURALS.length) return;
    isFlipping = true;

    const rect = kuralCard.getBoundingClientRect();
    const stageRect = flipStage.getBoundingClientRect();
    const clone = kuralCard.cloneNode(true);
    clone.classList.add('flip-leaving');
    clone.style.position = 'absolute';
    clone.style.top = (rect.top - stageRect.top) + 'px';
    clone.style.left = (rect.left - stageRect.left) + 'px';
    clone.style.width = rect.width + 'px';
    clone.style.height = rect.height + 'px';
    clone.style.margin = '0';
    clone.style.transformOrigin = direction === 'next' ? 'left center' : 'right center';
    flipStage.appendChild(clone);

    cardIndex = newIndex;
    kuralCard.innerHTML = cardContentHtml(KURALS[cardIndex]);

    requestAnimationFrame(() => requestAnimationFrame(() => {
      clone.classList.add(direction === 'next' ? 'flip-out-left' : 'flip-out-right');
    }));

    clone.addEventListener('transitionend', () => {
      clone.remove();
      isFlipping = false;
    }, { once: true });

    setTimeout(() => {
      if (clone.parentNode) clone.remove();
      isFlipping = false;
    }, 700);
  }

  cardBackBtn.addEventListener('click', () => returnToView());

  let touchStartX = null, touchStartY = null;
  flipStage.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  flipStage.addEventListener('touchend', (e) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    touchStartX = null;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) flipTo(cardIndex + 1, 'next');
      else flipTo(cardIndex - 1, 'prev');
    }
  });

  let mouseStartX = null;
  flipStage.addEventListener('mousedown', (e) => { mouseStartX = e.clientX; });
  flipStage.addEventListener('mouseup', (e) => {
    if (mouseStartX === null) return;
    const dx = e.clientX - mouseStartX;
    mouseStartX = null;
    if (Math.abs(dx) > 55) {
      if (dx < 0) flipTo(cardIndex + 1, 'next');
      else flipTo(cardIndex - 1, 'prev');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (cardScreen.classList.contains('hidden')) return;
    if (e.key === 'ArrowLeft') flipTo(cardIndex - 1, 'prev');
    if (e.key === 'ArrowRight') flipTo(cardIndex + 1, 'next');
    if (e.key === 'Escape') returnToView();
  });

  /* ---------------- Theme toggle ---------------- */

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeIconSun.classList.add('hidden');
      themeIconMoon.classList.remove('hidden');
    } else {
      document.documentElement.removeAttribute('data-theme');
      themeIconSun.classList.remove('hidden');
      themeIconMoon.classList.add('hidden');
    }
    localStorage.setItem('valluvam-theme', theme);
  }

  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    applyTheme(isDark ? 'light' : 'dark');
  });

  const savedTheme = localStorage.getItem('valluvam-theme');
  if (savedTheme) {
    applyTheme(savedTheme);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    applyTheme('dark');
  }

  /* ---------------- Boot ---------------- */

  fetch('kural_data.json')
    .then(r => r.json())
    .then(data => { KURALS = data; })
    .catch(() => {
      searchResults.innerHTML = `<div class="empty-state">Could not load kural data. Check your connection and reload.</div>`;
    });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js').catch(() => {});
    });
  }
})();
