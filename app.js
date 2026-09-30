'use strict';

(function () {
  const {
    CONFIG, VERSION, classicShuffle, slideShuffle, isSlideSolved, evaluate, readStore, writeStore, removeStore
  } = PuzzleEngine;
  const HINT_LIMIT = CONFIG.hintLimit;
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const ALL_IMAGES = IMAGE_PACKS.flatMap(pack => pack.images);
  const imageById = id => ALL_IMAGES.find(img => img.id === id);
  const packByImageId = id => IMAGE_PACKS.find(pack => pack.images.some(img => img.id === id));

  const defaultSettings = { sound: true, vibration: true, particles: true };
  let progress = readStore('progress', {
    best: {}, onboarding: { classic: false, slide: false }, settings: { ...defaultSettings }, analytics: [], failedSnapshotToast: false
  });
  progress.settings = { ...defaultSettings, ...(progress.settings || {}) };
  progress.onboarding = { classic: false, slide: false, ...(progress.onboarding || {}) };
  if (!progress.analytics) progress.analytics = [];

  let currentScreen = 'home';
  let selectedImageId = null;
  let game = null;
  let timerId = null;
  let hintTimer = null;
  let dragState = null;
  let slideAnim = false;
  let bufferedSlide = null;

  const screenEls = { home: $('#home'), album: $('#album'), imageSelect: $('#imageSelect'), game: $('#game') };

  function saveProgress() {
    writeStore('progress', progress);
  }

  function track(event, data = {}) {
    const item = { event, data, t: Date.now() };
    progress.analytics.push(item);
    if (progress.analytics.length > 500) progress.analytics = progress.analytics.slice(-500);
    saveProgress();
    if (window.PuzzleAnalyticsHooks && typeof window.PuzzleAnalyticsHooks.send === 'function') {
      try { window.PuzzleAnalyticsHooks.send(item); } catch (_) {}
    }
  }

  function showToast(message, duration = 1900) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => toast.classList.remove('show'), duration);
  }

  function formatTime(ms, exact = false) {
    const total = Math.floor(ms / (exact ? 100 : 1000));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  function bestKey(imageId, mode, grid) { return `${imageId}-${mode}-${grid}`; }
  function bestFor(imageId, mode, grid) { return progress.best[bestKey(imageId, mode, grid)] || null; }
  function totalStars() { return Object.values(progress.best).reduce((sum, item) => sum + (item.stars || 0), 0); }
  function bestCount() { return Object.keys(progress.best).length; }
  function packUnlocked(pack) { return totalStars() >= pack.unlockAt; }
  function imageUnlocked(image, index) {
    const pack = packByImageId(image.id);
    if (!packUnlocked(pack)) return false;
    return index === 0 || pack.images.slice(0, index).some(prev => ALL_IMAGES.some(() => false) || Object.keys(progress.best).some(key => key.startsWith(`${prev.id}-`)));
  }
  function anyClassic3Clear() { return Object.keys(progress.best).some(key => key.endsWith('-classic-3')); }
  function slide3Stars() {
    return Object.entries(progress.best).reduce((sum, [key, value]) => sum + (key.endsWith('-slide-3') ? (value.stars || 0) : 0), 0);
  }
  function modeUnlocked(mode, grid) {
    if (mode === 'classic') return grid === 3 || (grid === 4 && totalStars() >= 3) || (grid === 5 && totalStars() >= 8);
    if (mode === 'slide') return grid === 3 ? anyClassic3Clear() : slide3Stars() >= 3;
    return false;
  }
  function modeLockReason(mode, grid) {
    if (mode === 'classic') {
      if (grid === 4) return '累计 3 星解锁';
      if (grid === 5) return '累计 8 星解锁';
    } else {
      if (grid === 3) return '通关一次经典 3×3 解锁';
      if (grid === 4) return '滑块 3×3 累计 3 星解锁';
    }
    return '';
  }

  function switchScreen(name) {
    currentScreen = name;
    Object.entries(screenEls).forEach(([key, el]) => el.classList.toggle('active', key === name));
    if (name !== 'game') stopTimer();
  }

  /* ---------- audio / haptics ---------- */
  let audioContext = null;
  function ensureAudio() {
    if (!progress.settings.sound) return null;
    try {
      audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') audioContext.resume();
      return audioContext;
    } catch (_) { return null; }
  }
  function tone(freq, duration = 0.08, type = 'sine', gain = 0.05, delay = 0) {
    const ctx = ensureAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type; osc.frequency.value = freq;
    amp.gain.setValueAtTime(0, ctx.currentTime + delay);
    amp.gain.linearRampToValueAtTime(gain, ctx.currentTime + delay + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
    osc.connect(amp).connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.02);
  }
  function playSound(name) {
    if (!progress.settings.sound) return;
    if (name === 'pick') tone(660, .07, 'sine', .04);
    if (name === 'lock') { tone(880, .07, 'triangle', .05); tone(1320, .06, 'sine', .03, .05); }
    if (name === 'error') tone(220, .11, 'triangle', .035);
    if (name === 'slide') tone(520, .06, 'sine', .035);
    if (name === 'hint') tone(760, .12, 'sine', .04);
    if (name === 'ui') tone(480, .04, 'sine', .025);
    if (name === 'win') [523, 659, 784, 1046].forEach((f, i) => tone(f, .22, 'sine', .055, i * .14));
  }
  function vibrate(pattern) {
    if (!progress.settings.vibration || !navigator.vibrate) return;
    try { navigator.vibrate(pattern); } catch (_) {}
  }

  /* ---------- album & selection ---------- */
  function renderHome() {
    $('#total-stars').textContent = totalStars();
    $('#best-count').textContent = bestCount();
    $('#unlock-count').textContent = `${ALL_IMAGES.filter((img, idx) => imageUnlocked(img, idx % 6)).length}/12`;
    const snapshot = readStore('snapshot', null);
    const card = $('#continue-card');
    if (snapshot && imageById(snapshot.imageId)) {
      const img = imageById(snapshot.imageId);
      const modeText = snapshot.mode === 'classic' ? '经典切块' : '滑块华容道';
      card.classList.remove('hidden');
      card.innerHTML = `<strong>继续上局 · ${img.title}</strong><small>${modeText} ${snapshot.grid}×${snapshot.grid} · ${formatTime(snapshot.elapsedMs)} · ${snapshot.moves} 步</small>`;
      card.onclick = () => { playSound('ui'); resumeSnapshot(snapshot); };
    } else {
      card.classList.add('hidden');
    }
  }

  function renderAlbum() {
    $('#album-stars').textContent = `${totalStars()} ★`;
    const body = $('#album-body');
    body.innerHTML = '';
    IMAGE_PACKS.forEach(pack => {
      const unlockedPack = packUnlocked(pack);
      const packWrap = document.createElement('section');
      packWrap.className = unlockedPack ? '' : 'locked-pack';
      packWrap.innerHTML = `<div class="pack-title"><h3>${pack.title}</h3><small>${unlockedPack ? '已解锁' : `累计 ${pack.unlockAt} 星解锁`}</small></div>`;
      const grid = document.createElement('div');
      grid.className = 'grid';
      pack.images.forEach((image, index) => {
        const canPlay = imageUnlocked(image, index);
        const card = document.createElement('button');
        card.className = `image-card ${canPlay ? '' : 'locked'}`;
        card.type = 'button';
        card.innerHTML = `<div class="art" style="background-image:url('${image.src}');background-color:${image.primary}"></div>
          ${canPlay ? '' : '<div class="lock">🔒</div>'}
          <div class="label"><span>${image.title}</span><span class="stars">${packStars(image)} ★</span></div>`;
        if (canPlay) card.onclick = () => { playSound('ui'); selectedImageId = image.id; renderImageSelect(); switchScreen('imageSelect'); };
        else card.onclick = () => showToast(unlockedPack ? '先通关上一张图' : '累计星数不足');
        grid.appendChild(card);
      });
      packWrap.appendChild(grid);
      body.appendChild(packWrap);
    });
  }

  function packStars(image) {
    let stars = 0, count = 0;
    Object.entries(progress.best).forEach(([key, value]) => {
      if (key.startsWith(`${image.id}-`)) { stars += value.stars || 0; count++; }
    });
    return count ? `${stars}` : '—';
  }

  function renderImageSelect() {
    const image = imageById(selectedImageId);
    if (!image) return;
    $('#select-title').textContent = image.title;
    const preview = $('#select-preview');
    preview.style.backgroundImage = `url('${image.src}')`;
    preview.style.backgroundColor = image.primary;
    const container = $('#select-mode');
    container.innerHTML = '';
    [['classic', 3], ['classic', 4], ['classic', 5], ['slide', 3], ['slide', 4]].forEach(([mode, grid]) => {
      const unlocked = modeUnlocked(mode, grid);
      const best = bestFor(image.id, mode, grid);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `mode-option ${mode} ${unlocked ? '' : 'locked'}`;
      btn.innerHTML = `<span class="badge">${mode === 'classic' ? '切' : '滑'}</span>
        <span><strong>${mode === 'classic' ? '经典切块' : '滑块华容道'} ${grid}×${grid}</strong>
        <small>${unlocked ? (best ? `最佳 ${best.score} 分 · ${best.stars} ★` : '未通关') : modeLockReason(mode, grid)}</small></span>
        <span class="lock">${unlocked ? '›' : '🔒'}</span>`;
      btn.onclick = () => {
        if (!unlocked) { playSound('error'); showToast(modeLockReason(mode, grid)); return; }
        startGame(image, mode, grid, 'new');
      };
      container.appendChild(btn);
    });
    const bestList = $('#best-list');
    const keys = Object.entries(progress.best).filter(([key]) => key.startsWith(`${image.id}-`));
    bestList.innerHTML = keys.length ? '<strong>本图最佳成绩</strong>' : '<small>完成一局后会在这里记录最佳成绩。</small>';
    keys.forEach(([key, value]) => {
      const [imageId, mode, grid] = key.split('-');
      const row = document.createElement('div');
      row.className = 'best-item';
      row.innerHTML = `<span>${mode === 'classic' ? '经典' : '滑块'} ${grid}×${grid}</span><strong>${value.stars} ★ · ${value.score} 分</strong>`;
      bestList.appendChild(row);
    });
  }

  /* ---------- game bootstrap ---------- */
  function createGameState(image, mode, grid, entry) {
    const total = grid * grid;
    const state = {
      image, mode, grid, entry,
      elapsedMs: 0, started: false, paused: false,
      moves: 0, hints: 0, ghost: mode === 'classic' && grid === 3,
      placed: new Map(), trayOrder: [], cells: [],
      onboard: null
    };
    if (mode === 'classic') {
      const shuffle = classicShuffle(total);
      state.trayOrder = shuffle.order;
      if (shuffle.failed) track('shuffle_failed', { mode, grid, attempts: shuffle.attempts });
      else if (shuffle.attempts > 1) track('shuffle_retry', { mode, grid, attempts: shuffle.attempts });
    } else {
      const shuffle = slideShuffle(grid, CONFIG.slide[grid].k);
      state.cells = shuffle.cells;
    }
    return state;
  }

  function startGame(image, mode, grid, entry) {
    const snapshot = readStore('snapshot', null);
    if (snapshot) {
      confirmOverlay('放弃当前进度？', '开始新对局会覆盖当前续局快照。', () => reallyStart(image, mode, grid, entry));
      return;
    }
    reallyStart(image, mode, grid, entry);
  }

  function reallyStart(image, mode, grid, entry) {
    game = createGameState(image, mode, grid, entry);
    track('level_start', { imageId: image.id, mode, grid, entry });
    if (!progress.onboarding.classic && image.id === 'a1' && mode === 'classic' && grid === 3) game.onboard = 'classic';
    if (!progress.onboarding.slide && image.id === 'a1' && mode === 'slide' && grid === 3) game.onboard = 'slide';
    switchScreen('game');
    renderGame();
    saveSnapshot();
    if (game.onboard) showOnboarding();
  }

  function resumeSnapshot(snapshot) {
    const image = imageById(snapshot.imageId);
    if (!image) { discardSnapshot('上一局记录已失效'); return; }
    game = createGameState(image, snapshot.mode, snapshot.grid, 'continue');
    game.elapsedMs = snapshot.elapsedMs || 0;
    game.started = snapshot.started || false;
    game.moves = snapshot.moves || 0;
    game.hints = snapshot.hints || 0;
    game.ghost = !!snapshot.ghost;
    if (snapshot.mode === 'classic') {
      game.trayOrder = snapshot.trayOrder || [];
      (snapshot.placed || []).forEach(([piece, cell]) => game.placed.set(piece, cell));
    } else {
      game.cells = snapshot.cells || [];
    }
    track('level_start', { imageId: image.id, mode: game.mode, grid: game.grid, entry: 'continue' });
    switchScreen('game');
    game.paused = true;
    renderGame();
    showPause();
  }

  function saveSnapshot() {
    if (!game || game.onboard) return;
    writeStore('snapshot', {
      imageId: game.image.id, mode: game.mode, grid: game.grid,
      elapsedMs: Math.round(game.elapsedMs), started: game.started, moves: game.moves,
      hints: game.hints, ghost: game.ghost,
      placed: game.mode === 'classic' ? Array.from(game.placed.entries()) : undefined,
      trayOrder: game.mode === 'classic' ? game.trayOrder : undefined,
      cells: game.mode === 'slide' ? game.cells : undefined
    });
  }
  function discardSnapshot(message) {
    removeStore('snapshot');
    if (message) showToast(message);
    renderHome();
  }

  /* ---------- game render ---------- */
  function renderGame() {
    const board = $('#board');
    const tray = $('#tray');
    const ghostLayer = $('#ghost-layer');
    board.innerHTML = '';
    tray.innerHTML = '';
    board.classList.toggle('has-ghost', game.ghost);
    $('#game-title').textContent = game.image.title;
    $('#game-mode').textContent = `${game.mode === 'classic' ? '经典切块' : '滑块华容道'} ${game.grid}×${game.grid}`;
    $('#btn-ghost').disabled = game.mode !== 'classic';
    $('#btn-hint').disabled = false;
    $('#hint-count').textContent = HINT_LIMIT - game.hints;
    updateStats();
    layoutBoard();
    const total = game.grid * game.grid;
    for (let i = 0; i < total; i++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.cell = i;
      board.appendChild(cell);
    }
    ghostLayer.style.backgroundImage = `url('${game.image.src}')`;
    ghostLayer.style.backgroundColor = game.image.primary;

    if (game.mode === 'classic') {
      game.trayOrder.forEach(pieceId => {
        if (!game.placed.has(pieceId)) tray.appendChild(makePieceElement(pieceId));
      });
      game.placed.forEach((cellIndex, pieceId) => {
        const piece = makePieceElement(pieceId);
        placePieceAt(piece, cellIndex);
        piece.classList.add('locked');
        board.appendChild(piece);
      });
      $('#tray-zone').style.display = '';
    } else {
      game.cells.forEach((pieceId, cellIndex) => {
        if (pieceId === null) return;
        const piece = makePieceElement(pieceId);
        placePieceAt(piece, cellIndex);
        board.appendChild(piece);
      });
      const trayZone = $('#tray-zone');
      trayZone.style.display = '';
      tray.innerHTML = `<div class="tray-scroll" style="display:grid;place-items:center;padding:14px;">
        <p style="margin:0;color:var(--muted);text-align:center;line-height:1.5">点一下与空位相邻的拼块，把它滑入空位。<br>空位会回到右下角。</p></div>`;
    }
  }

  function layoutBoard() {
    const boardEl = $('#board');
    const boardSize = Math.min(boardEl.clientWidth, boardEl.clientHeight) || 320;
    const cellSize = boardSize / game.grid;
    const gameEl = $('#game');
    gameEl.style.setProperty('--board', `${boardSize}px`);
    gameEl.style.setProperty('--cell', `${cellSize}px`);
    gameEl.style.setProperty('--tray-piece', `${cellSize * CONFIG.trayScale}px`);
    gameEl.style.setProperty('--trayScale', CONFIG.trayScale);
    gameEl.style.setProperty('--anim', `${CONFIG.animSnapMs}ms`);
    gameEl.style.setProperty('--ghostOpacity', game.mode === 'classic' && game.grid === 3 ? '.15' : '.12');
    const ghostLayer = $('#ghost-layer');
    const boardRect = boardEl.getBoundingClientRect();
    const wrapRect = $('#board-wrap').getBoundingClientRect();
    ghostLayer.style.left = `${boardRect.left - wrapRect.left}px`;
    ghostLayer.style.top = `${boardRect.top - wrapRect.top}px`;
    ghostLayer.style.width = `${boardRect.width}px`;
    ghostLayer.style.height = `${boardRect.height}px`;
    ghostLayer.style.backgroundSize = `${boardSize}px ${boardSize}px`;
  }

  function makePieceElement(pieceId) {
    const grid = game.grid;
    const row = Math.floor(pieceId / grid), col = pieceId % grid;
    const el = document.createElement('div');
    el.className = 'piece';
    el.dataset.piece = pieceId;
    el.style.backgroundImage = `url('${game.image.src}')`;
    el.style.setProperty('--bgx', -(col / grid));
    el.style.setProperty('--bgy', -(row / grid));
    if (game.mode === 'slide') {
      const num = document.createElement('span');
      num.className = 'num';
      num.textContent = pieceId + 1;
      el.appendChild(num);
    }
    if (game.mode === 'classic') attachClassicDrag(el);
    else attachSlideInput(el);
    return el;
  }

  function placePieceAt(el, cellIndex) {
    const grid = game.grid;
    const row = Math.floor(cellIndex / grid), col = cellIndex % grid;
    el.style.left = `${col * 100 / grid}%`;
    el.style.top = `${row * 100 / grid}%`;
  }

  function updateStats() {
    $('#stat-time').textContent = formatTime(game.elapsedMs);
    $('#stat-moves').textContent = game.moves;
    const total = game.grid * game.grid;
    const solvedCount = game.mode === 'classic' ? game.placed.size : game.cells.reduce((n, piece, index) => n + (piece === index ? 1 : 0), 0);
    $('#stat-progress').textContent = `${Math.round(solvedCount / total * 100)}%`;
  }

  /* ---------- timer ---------- */
  function startTimerIfNeeded() {
    if (game.started) return;
    game.started = true;
    game.lastTick = performance.now();
    timerId = setInterval(tickTimer, 100);
  }
  function tickTimer() {
    if (!game || game.paused || !game.started) return;
    const now = performance.now();
    game.elapsedMs += now - game.lastTick;
    game.lastTick = now;
    $('#stat-time').textContent = formatTime(game.elapsedMs);
  }
  function stopTimer() {
    clearInterval(timerId);
    timerId = null;
  }
  function pauseGame(auto = false) {
    if (!game || game.paused) return;
    game.paused = true;
    stopTimer();
    if (dragState) cancelDrag(false);
    hideHint(false);
    saveSnapshot();
    showPause(auto ? '已自动暂停' : undefined);
  }
  function resumeGame() {
    if (!game) return;
    game.paused = false;
    if (game.started) game.lastTick = performance.now();
    hideOverlay();
  }

  /* ---------- classic drag ---------- */
  function attachClassicDrag(el) {
    el.addEventListener('pointerdown', event => {
      if (!game || game.paused || dragState || game.onboard === 'classic-lock') return;
      if (event.pointerId !== undefined && dragState && dragState.pointerId !== event.pointerId) return;
      const pieceId = Number(el.dataset.piece);
      if (game.placed.has(pieceId)) return;
      if (game.onboard === 'classic' && pieceId !== 0) return;
      event.preventDefault();
      startTimerIfNeeded();
      playSound('pick');
      const pieceEl = makeDragElement(pieceId);
      dragState = { pointerId: event.pointerId, pieceId, origin: el, dragEl: pieceEl, startX: event.clientX, startY: event.clientY, moved: false };
      try {
        el.setPointerCapture(event.pointerId);
        dragState.pointerCaptured = true;
      } catch (_) {}
      el.classList.add('grabbed');
      moveDrag(event.clientX, event.clientY);
    });
  }

  function makeDragElement(pieceId) {
    const dragEl = makePieceElement(pieceId);
    dragEl.classList.add('dragging');
    $('#board').appendChild(dragEl);
    return dragEl;
  }

  function moveDrag(clientX, clientY) {
    const boardEl = $('#board');
    const rect = boardEl.getBoundingClientRect();
    const cell = rect.width / game.grid;
    const x = clientX - rect.left - cell / 2;
    const y = clientY - rect.top - cell / 2 - cell * 1.2;
    dragState.dragEl.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    const center = { x: clientX, y: clientY - cell * 1.2 };
    const candidate = nearestEmptyCell(center, rect, cell);
    $$('.cell').forEach(cellEl => cellEl.classList.toggle('preview', candidate === Number(cellEl.dataset.cell)));
    dragState.candidate = candidate;
  }

  function nearestEmptyCell(point, boardRect, cell) {
    const grid = game.grid;
    for (let i = 0; i < grid * grid; i++) {
      if (game.placed.has(i)) continue;
      const row = Math.floor(i / grid), col = i % grid;
      const cx = boardRect.left + col * cell + cell / 2;
      const cy = boardRect.top + row * cell + cell / 2;
      if (Math.hypot(point.x - cx, point.y - cy) <= cell * CONFIG.snapTolerance) return i;
    }
    return null;
  }

  function cancelDrag(countMove) {
    if (!dragState) return;
    const { dragEl, origin, pieceId } = dragState;
    if (dragState.pointerCaptured && dragState.pointerId != null) {
      try { origin.releasePointerCapture(dragState.pointerId); } catch (_) {}
    }
    dragEl.remove();
    origin.classList.remove('grabbed');
    dragState = null;
    $$('.cell').forEach(cell => cell.classList.remove('preview'));
    if (countMove && game) { game.moves++; updateStats(); saveSnapshot(); }
  }

  window.addEventListener('pointermove', event => {
    if (!dragState) return;
    if (event.pointerId !== dragState.pointerId) return;
    event.preventDefault();
    if (Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY) > CONFIG.moveThreshold) dragState.moved = true;
    moveDrag(event.clientX, event.clientY);
  }, { passive: false });

  window.addEventListener('pointerup', event => {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    const { dragEl, origin, pieceId, candidate } = dragState;
    if (dragState.pointerCaptured) {
      try { origin.releasePointerCapture(event.pointerId); } catch (_) {}
    }
    startTimerIfNeeded();
    game.moves++;
    dragState = null;
    if (candidate != null && !game.placed.has(candidate)) {
      const correct = pieceId === candidate;
      placePieceAt(dragEl, candidate);
      dragEl.classList.remove('dragging');
      dragEl.style.transform = '';
      if (correct) {
        dragEl.classList.add('locked');
        game.placed.set(pieceId, candidate);
        origin.remove();
        $('#board').appendChild(dragEl);
        playSound('lock');
        vibrate(10);
        updateStats();
        saveSnapshot();
        if (game.onboard === 'classic') {
          if (game.placed.size >= 2) {
            progress.onboarding.classic = true;
            game.onboard = null;
            saveProgress();
            $('#btn-hint').classList.add('pulse');
            showToast('找不到时点这里');
            setTimeout(() => $('#btn-hint').classList.remove('pulse'), 2400);
          } else showToast('很好，继续拼完剩下的块');
        }
        if (game.placed.size === game.grid * game.grid) return finishGame();
      } else {
        playSound('error');
        dragEl.classList.add('flash');
        setTimeout(() => {
          dragEl.remove();
          origin.classList.remove('grabbed');
        }, 200);
        updateStats();
        saveSnapshot();
      }
    } else {
      dragEl.remove();
      origin.classList.remove('grabbed');
      updateStats();
      saveSnapshot();
    }
  });
  window.addEventListener('pointercancel', () => cancelDrag(false));

  /* ---------- slide input ---------- */
  function attachSlideInput(el) {
    let down = null;
    el.addEventListener('pointerdown', event => {
      if (!game || game.paused || slideAnim) return;
      down = { id: event.pointerId, x: event.clientX, y: event.clientY };
      event.preventDefault();
    });
    el.addEventListener('pointerup', event => {
      if (!down || down.id !== event.pointerId) return;
      const dx = event.clientX - down.x, dy = event.clientY - down.y;
      down = null;
      trySlideMove(Number(el.dataset.piece), Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    });
  }

  function trySlideMove(pieceId, direction = null) {
    if (!game || game.paused) return;
    const grid = game.grid;
    const blankIndex = game.cells.indexOf(null);
    const pieceIndex = game.cells.indexOf(pieceId);
    const blankNeighbors = PuzzleEngine.neighbors(blankIndex, grid);
    const adjacent = blankNeighbors.includes(pieceIndex);
    if (!adjacent || (direction && !directionAllowsMove(pieceIndex, blankIndex, direction))) {
      if (!slideAnim) {
        const pieceEl = $(`#board .piece[data-piece="${pieceId}"]`);
        if (pieceEl) {
          pieceEl.classList.add('shake');
          setTimeout(() => pieceEl.classList.remove('shake'), 160);
        }
        playSound('error');
      } else bufferedSlide = { pieceId, direction };
      return;
    }
    if (slideAnim) { bufferedSlide = { pieceId, direction }; return; }
    startTimerIfNeeded();
    playSound('slide');
    game.cells[blankIndex] = pieceId;
    game.cells[pieceIndex] = null;
    game.moves++;
    slideAnim = true;
    const pieceEl = $(`#board .piece[data-piece="${pieceId}"]`);
    if (pieceEl) placePieceAt(pieceEl, blankIndex);
    updateStats();
    saveSnapshot();
    setTimeout(() => {
      slideAnim = false;
      if (isSlideSolved(game.cells)) return finishGame();
      if (game.onboard === 'slide' && game.moves >= 3) {
        progress.onboarding.slide = true;
        game.onboard = null;
        saveProgress();
        hideOverlay();
        showToast('很好，继续复原');
      }
      if (bufferedSlide) {
        const next = bufferedSlide;
        bufferedSlide = null;
        trySlideMove(next.pieceId, next.direction);
      }
    }, CONFIG.animSnapMs);
  }

  function directionAllowsMove(pieceIndex, blankIndex, direction) {
    const grid = game.grid;
    const pr = Math.floor(pieceIndex / grid), pc = pieceIndex % grid;
    const br = Math.floor(blankIndex / grid), bc = blankIndex % grid;
    return (direction === 'left' && br === pr && bc === pc - 1)
      || (direction === 'right' && br === pr && bc === pc + 1)
      || (direction === 'up' && bc === pc && br === pr - 1)
      || (direction === 'down' && bc === pc && br === pr + 1);
  }

  /* ---------- hints ---------- */
  function useHint() {
    if (!game || game.paused) return;
    if (game.hints >= HINT_LIMIT) return;
    game.hints++;
    $('#hint-count').textContent = HINT_LIMIT - game.hints;
    track('hint_use', { mode: game.mode, grid: game.grid, attempt: game.hints, remaining: unsolvedCount() });
    playSound('hint');
    saveSnapshot();
    clearTimeout(hintTimer);
    hideHint();
    if (game.mode === 'classic') {
      const pieceId = Array.from({ length: game.grid * game.grid }, (_, i) => i).find(id => !game.placed.has(id));
      if (pieceId == null) return;
      const trayEl = $(`#tray .piece[data-piece="${pieceId}"]`);
      const target = $(`#board .cell[data-cell="${pieceId}"]`);
      if (trayEl) trayEl.classList.add('hint');
      if (target) target.classList.add('hint-target');
    } else {
      const targetIndex = game.cells.findIndex((piece, index) => index !== game.cells.length - 1 && piece !== index);
      if (targetIndex < 0) return;
      const target = $(`#board .cell[data-cell="${targetIndex}"]`);
      const pieceEl = $(`#board .piece[data-piece="${game.cells[targetIndex]}"]`);
      if (target) target.classList.add('hint-target');
      if (pieceEl) pieceEl.classList.add('hint');
    }
    hintTimer = setTimeout(() => hideHint(), 2000);
  }
  function hideHint(clearOnly = true) {
    $$('.piece.hint').forEach(el => el.classList.remove('hint'));
    $$('.cell.hint-target').forEach(el => el.classList.remove('hint-target'));
    if (!clearOnly) { clearTimeout(hintTimer); hintTimer = null; }
  }
  function unsolvedCount() {
    if (!game) return 0;
    return game.mode === 'classic' ? game.grid * game.grid - game.placed.size : game.cells.filter((piece, index) => index !== game.cells.length - 1 && piece !== index).length;
  }

  /* ---------- finish ---------- */
  function finishGame() {
    stopTimer();
    game.paused = true;
    const elapsedSeconds = game.elapsedMs / 1000;
    const result = evaluate(game.mode, game.grid, elapsedSeconds, game.hints);
    const key = bestKey(game.image.id, game.mode, game.grid);
    const previous = progress.best[key];
    const isRecord = !previous || result.score > previous.score;
    if (isRecord) progress.best[key] = {
      score: result.score, stars: result.stars, timeMs: Math.round(game.elapsedMs), moves: game.moves, hints: game.hints
    };
    saveProgress();
    removeStore('snapshot');
    track('level_complete', {
      imageId: game.image.id, mode: game.mode, grid: game.grid, timeSeconds: Math.round(elapsedSeconds),
      moves: game.moves, hints: game.hints, stars: result.stars, score: result.score
    });
    const winImage = document.createElement('div');
    winImage.className = 'win-image';
    winImage.style.backgroundImage = `url('${game.image.src}')`;
    $('#board').appendChild(winImage);
    playSound('win');
    vibrate([12, 40, 12, 40, 24]);
    spawnParticles();
    setTimeout(() => showResult(result, isRecord), CONFIG.animWinMs);
  }

  function spawnParticles() {
    if (!progress.settings.particles) return;
    const container = $('#particles');
    container.innerHTML = '';
    for (let i = 0; i < 28; i++) {
      const spark = document.createElement('span');
      spark.className = 'spark';
      spark.textContent = Math.random() > .5 ? '★' : '✦';
      spark.style.left = `${10 + Math.random() * 80}%`;
      spark.style.top = `${45 + Math.random() * 40}%`;
      spark.style.animationDelay = `${Math.random() * .45}s`;
      container.appendChild(spark);
    }
    setTimeout(() => { container.innerHTML = ''; }, 1800);
  }

  function nextImage() {
    const pack = packByImageId(game.image.id);
    const index = pack.images.findIndex(img => img.id === game.image.id);
    const next = pack.images[index + 1];
    const image = next || pack.images[0];
    selectedImageId = image.id;
    game = null;
    renderImageSelect();
    switchScreen('imageSelect');
  }

  /* ---------- overlays ---------- */
  const overlay = $('#overlay');
  const overlayCard = $('#overlay-card');
  function hideOverlay() {
    overlay.classList.add('hidden');
    overlayCard.innerHTML = '';
  }
  function showOverlay(html) {
    overlayCard.innerHTML = html;
    overlay.classList.remove('hidden');
  }
  function confirmOverlay(title, message, onConfirm) {
    showOverlay(`<h3>${title}</h3><p>${message}</p><div class="overlay-actions two">
      <button class="ghost" data-action="cancel">取消</button><button class="primary" data-action="confirm">确认</button></div>`);
    overlayCard.querySelector('[data-action="cancel"]').onclick = () => { playSound('ui'); hideOverlay(); if (game && game.paused && currentScreen === 'game') showPause(); };
    overlayCard.querySelector('[data-action="confirm"]').onclick = () => { playSound('ui'); hideOverlay(); onConfirm(); };
  }
  function showPause(notice) {
    showOverlay(`<h3>暂停中</h3><p>${notice || '计时已冻结，棋盘已遮罩。'} 随时继续，进度已保存在本机。</p>
      <div class="overlay-actions">
        <button class="primary" data-action="resume">继续</button>
        <div class="overlay-actions two">
          <button class="ghost" data-action="restart">重开</button>
          <button class="ghost" data-action="exit">退出</button>
        </div>
      </div>`);
    overlayCard.querySelector('[data-action="resume"]').onclick = () => { playSound('ui'); resumeGame(); };
    overlayCard.querySelector('[data-action="restart"]').onclick = () => confirmOverlay('重开这一局？', '当前局面会被覆盖。', () => reallyStart(game.image, game.mode, game.grid, 'new'));
    overlayCard.querySelector('[data-action="exit"]').onclick = () => { playSound('ui'); exitGame(); };
  }
  function showResult(result, isRecord) {
    const nextText = '下一张图';
    showOverlay(`<h3>复原完成</h3><div class="result-stars">${'★'.repeat(result.stars)}${'☆'.repeat(3 - result.stars)}</div>
      <p>${isRecord ? '🎉 新纪录！' : '已完成，可以挑战更快成绩。'}</p>
      <div class="result-grid">
        <div><span>用时</span><strong>${formatTime(game.elapsedMs)}</strong></div>
        <div><span>步数</span><strong>${game.moves}</strong></div>
        <div><span>基础分</span><strong>${result.base}</strong></div>
        <div><span>时间奖励</span><strong>+${result.timeBonus}</strong></div>
        <div><span>提示扣减</span><strong>-${result.penalty}</strong></div>
        <div><span>总分</span><strong>${result.score}</strong></div>
      </div>
      <div class="overlay-actions two">
        <button class="ghost" data-action="replay">再拼一次</button>
        <button class="primary" data-action="next">${nextText}</button>
      </div>`);
    overlayCard.querySelector('[data-action="replay"]').onclick = () => { playSound('ui'); hideOverlay(); reallyStart(game.image, game.mode, game.grid, 'new'); };
    overlayCard.querySelector('[data-action="next"]').onclick = () => { playSound('ui'); hideOverlay(); nextImage(); };
  }
  function showOnboarding() {
    if (game.onboard === 'classic') {
      showOverlay('<h3>拖住拼块</h3><p>把托盘里的高亮拼块，放到发亮的位置。</p><div class="overlay-actions"><button class="primary" data-action="start">开始</button></div>');
      overlayCard.querySelector('[data-action="start"]').onclick = () => {
        hideOverlay();
        const target = $('#board .cell[data-cell="0"]');
        const piece = $('#tray .piece[data-piece="0"]');
        if (target) target.classList.add('hint-target');
        if (piece) piece.classList.add('hint');
      };
      track('onboarding_step', { step: 'classic', done: false });
    } else if (game.onboard === 'slide') {
      showOverlay('<h3>点一下空格旁的拼块</h3><p>相邻拼块会滑入空位。完成 3 次移动后继续。</p><div class="overlay-actions"><button class="primary" data-action="start">开始</button></div>');
      overlayCard.querySelector('[data-action="start"]').onclick = () => hideOverlay();
      track('onboarding_step', { step: 'slide', done: false });
    }
  }
  function showSettings() {
    const rows = [['sound', '音效'], ['vibration', '震动'], ['particles', '通关粒子效果']];
    showOverlay(`<h3>设置</h3>${rows.map(([key, label]) => `<div class="settings-row"><span>${label}</span><button class="switch ${progress.settings[key] ? 'on' : ''}" data-setting="${key}" aria-label="${label}"></button></div>`).join('')}
      <div class="overlay-actions"><button class="ghost" data-action="tutorial">再看一次新手引导</button><button class="primary" data-action="close">完成</button></div>`);
    overlayCard.querySelectorAll('[data-setting]').forEach(btn => {
      btn.onclick = () => {
        const key = btn.dataset.setting;
        progress.settings[key] = !progress.settings[key];
        btn.classList.toggle('on', progress.settings[key]);
        saveProgress();
        playSound('ui');
      };
    });
    overlayCard.querySelector('[data-action="tutorial"]').onclick = () => {
      progress.onboarding.classic = false;
      progress.onboarding.slide = false;
      saveProgress();
      hideOverlay();
      showToast('下次进入对应模式时重播');
    };
    overlayCard.querySelector('[data-action="close"]').onclick = () => { playSound('ui'); hideOverlay(); };
  }

  /* ---------- navigation ---------- */
  function exitGame() {
    hideOverlay();
    if (!game) { switchScreen('home'); renderHome(); return; }
    if (game.onboard) {
      if (game.onboard === 'classic') progress.onboarding.classic = true;
      if (game.onboard === 'slide') progress.onboarding.slide = true;
      saveProgress();
      removeStore('snapshot');
      game = null;
      switchScreen('home');
      renderHome();
      return;
    }
    saveSnapshot();
    track('level_quit', {
      imageId: game.image.id, mode: game.mode, grid: game.grid,
      solved: game.grid * game.grid - unsolvedCount(), elapsedMs: Math.round(game.elapsedMs)
    });
    game = null;
    switchScreen('home');
    renderHome();
    showToast('进度已保存');
  }

  $('#open-album').onclick = () => { playSound('ui'); renderAlbum(); switchScreen('album'); };
  $('#open-settings').onclick = () => { playSound('ui'); showSettings(); };
  $('#btn-pause').onclick = () => { playSound('ui'); pauseGame(); };
  $('#btn-hint').onclick = () => {
    if (game.onboard) return;
    if (game.hints >= HINT_LIMIT) { showToast('本局提示已用完'); return; }
    useHint();
  };
  $('#btn-ghost').onclick = () => {
    game.ghost = !game.ghost;
    $('#board').classList.toggle('has-ghost', game.ghost);
    $('#btn-ghost').classList.toggle('active', game.ghost);
    saveSnapshot();
    playSound('ui');
  };
  $('#btn-restart').onclick = () => {
    if (game.onboard) return;
    confirmOverlay('重开这一局？', '当前局面会被覆盖。', () => reallyStart(game.image, game.mode, game.grid, 'new'));
  };
  $('#game-exit').onclick = () => {
    if (game && !game.paused) confirmOverlay('退出并保存？', '中途退出会保存续局快照，可从首页继续。', exitGame);
    else exitGame();
  };
  $$('.back').forEach(btn => btn.onclick = () => {
    playSound('ui');
    switchScreen(btn.dataset.back);
    if (btn.dataset.back === 'home') renderHome();
  });
  window.addEventListener('resize', () => { if (currentScreen === 'game' && game) layoutBoard(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && currentScreen === 'game' && game && !game.paused) pauseGame(true);
  });

  /* ---------- boot ---------- */
  if (typeof readStore('snapshot', null) === 'undefined') discardSnapshot();
  renderHome();
  saveProgress();
  if (!progress.onboarding.classic) {
    const first = imageById('a1');
    reallyStart(first, 'classic', 3, 'new');
  }
  window.PuzzleGame = {
    get state() { return game; },
    classicShuffle, slideShuffle, isSlideSolved, evaluate,
    getAnalytics: () => progress.analytics.slice(),
    clearAll: () => { progress = { best: {}, onboarding: { classic: false, slide: false }, settings: { ...defaultSettings }, analytics: [] }; removeStore('snapshot'); saveProgress(); renderHome(); switchScreen('home'); }
  };
})();
