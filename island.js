/*
  WinIsland website: the island itself.

  A web copy of the app's pill. The shapes are the app's own (each activity's PillShape:
  width, height, corner radius), growing uses the same bouncy spring and shrinking a firmer
  one, and the glass is the same stack: tint, a colour wash from the artwork, then a top
  highlight and rim. Every view is sized to its final shape and centred, so the pill reveals
  it as it grows, like the app's composition clip.
*/
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  // ---- Icons ------------------------------------------------------------------------------

  const stroke = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const filled = d => `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${d}</svg>`;

  const ICON = {
    play: filled('<path d="M8 5.6v12.8a1 1 0 0 0 1.53.85l10.2-6.4a1 1 0 0 0 0-1.7L9.53 4.75A1 1 0 0 0 8 5.6z"/>'),
    pause: filled('<rect x="6.5" y="5" width="4" height="14" rx="1.4"/><rect x="13.5" y="5" width="4" height="14" rx="1.4"/>'),
    next: filled('<path d="M4.5 6.3v11.4a.9.9 0 0 0 1.4.75l8.1-5.7a.9.9 0 0 0 0-1.5L5.9 5.55a.9.9 0 0 0-1.4.75z"/><rect x="16" y="5.5" width="3.2" height="13" rx="1.2"/>'),
    prev: filled('<path d="M19.5 6.3v11.4a.9.9 0 0 1-1.4.75L10 12.75a.9.9 0 0 1 0-1.5l8.1-5.7a.9.9 0 0 1 1.4.75z"/><rect x="4.8" y="5.5" width="3.2" height="13" rx="1.2"/>'),
    volume: stroke('<path d="M4 9.5v5h3.5l4.5 4v-13l-4.5 4H4z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6M18.2 6.4a7.6 7.6 0 0 1 0 11.2"/>'),
    mute: stroke('<path d="M4 9.5v5h3.5l4.5 4v-13l-4.5 4H4z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>'),
    sun: stroke('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>'),
    bolt: filled('<path d="M13.2 2.5 5 13.6h6.1L10.2 21.5 19 10.2h-6.2l.4-7.7z"/>'),
    headphones: stroke('<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="5" height="7" rx="2"/><rect x="16" y="14" width="5" height="7" rx="2"/>'),
    mic: stroke('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>'),
    camera: stroke('<rect x="3" y="6.5" width="13" height="11" rx="2.5"/><path d="m16 10.5 5-3v9l-5-3"/>'),
    note: stroke('<path d="M9 18V5.5l11-2V16"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>'),
    clipboard: stroke('<rect x="5" y="4.5" width="14" height="17" rx="2.5"/><rect x="8.5" y="2.5" width="7" height="4" rx="1.5"/>'),
    tray: stroke('<path d="M3 13.5 5.5 5.5h13l2.5 8v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5z"/><path d="M3 13.5h5l1.5 2.5h5l1.5-2.5h5"/>'),
    bell: stroke('<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15l1.5-2z"/><path d="M10 21h4"/>'),
    clock: stroke('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    link: stroke('<path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/>'),
    image: stroke('<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="9.5" r="1.8"/><path d="m21 16-5-5-9 9"/>'),
    text: stroke('<path d="M5 6h14M5 10h14M5 14h10M5 18h7"/>'),
    file: stroke('<path d="M7.5 2.5H14l5 5v12.5a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 20V4a1.5 1.5 0 0 1 1.5-1.5z"/><path d="M14 2.5v5h5"/>'),
    folder: stroke('<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>'),
    check: stroke('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
    sparkle: filled('<path d="m12 2.5 2 5.6 5.5 1.9-5.5 1.9-2 5.6-2-5.6L4.5 10l5.5-1.9 2-5.6z"/><path d="m18.5 15 .9 2.3 2.1.7-2.1.8-.9 2.2-.8-2.2-2.2-.8 2.2-.7.8-2.3z" opacity=".7"/>'),
    lock: stroke('<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>'),
    shield: stroke('<path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6L12 3z"/><path d="m9 12 2.2 2.2L15.5 10"/>'),
    chip: stroke('<rect x="6" y="6" width="12" height="12" rx="2.5"/><path d="M9.5 2.5V6M14.5 2.5V6M9.5 18v3.5M14.5 18v3.5M2.5 9.5H6M2.5 14.5H6M18 9.5h3.5M18 14.5h3.5"/>'),
    globe: stroke('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>'),
    fullscreen: stroke('<path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15"/>'),
    moon: stroke('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>'),
    grid: stroke('<rect x="4" y="4" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2"/>'),
    tag: stroke('<path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1.5 1.5 0 0 1 0 2.1l-6.2 6.2a1.5 1.5 0 0 1-2.1 0l-8.7-7.9z"/><circle cx="8" cy="8" r="1.4"/>'),
    question: stroke('<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.8"/><path d="M12 17.2h.01"/>'),
    cursor: filled('<path d="M5.2 3.3 18.6 10.6l-5.8 1.6-2.6 5.6L5.2 3.3z" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/>'),
    arrow: stroke('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    open: stroke('<path d="M14 4h6v6M20 4l-9 9M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/>'),
    x: stroke('<path d="M6 6l12 12M18 6 6 18"/>'),
    battery: stroke('<rect x="2.5" y="7" width="17" height="10" rx="2.5"/><path d="M22 10.5v3"/><rect x="5" y="9.5" width="7" height="5" rx="1" fill="currentColor" stroke="none"/>'),
  };

  function batteryIcon(percent, color) {
    const width = Math.max(1.6, 17 * percent / 100);
    return `<svg class="bat" viewBox="0 0 26 13" aria-hidden="true"><rect x=".75" y=".75" width="21" height="11.5" rx="3.2" fill="none" stroke="rgba(255,255,255,.42)" stroke-width="1.3"/><rect x="23" y="4.3" width="1.9" height="4.4" rx=".95" fill="rgba(255,255,255,.42)"/><rect x="2.6" y="2.6" width="${width.toFixed(1)}" height="7.8" rx="1.8" fill="${color}"/></svg>`;
  }

  // ---- Colour -----------------------------------------------------------------------------

  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => {
    const [x, y] = [hex(a), hex(b)];
    return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
  };
  const alpha = (h, a) => `rgba(${hex(h).join(',')},${a})`;

  // The glass is tinted from the artwork while music plays: a deep version of its colour for
  // the tint, a soft wash for the glow, and a bright one for the level bars and progress.
  function colorsFor(track) {
    const [a, b, c] = track.colors;
    return {
      tint: mix(b, '#0d0d12', 0.74),
      accent: mix(a, '#ffffff', 0.12),
      g1: alpha(a, 0.62),
      g2: alpha(c, 0.55),
    };
  }

  // ---- Music --------------------------------------------------------------------------------

  // Made-up songs with artwork painted in CSS (see .art-* in styles.css).
  const TRACKS = [
    { title: 'Golden Hour Drive', artist: 'Lumen Bay', source: 'Spotify', colors: ['#ffb36b', '#ff6f91', '#7a5cff'], art: 'sun', duration: 214 },
    { title: 'Neon Monsoon', artist: 'Kavi & the Tides', source: 'YouTube · Chrome', colors: ['#47dcff', '#3a6df0', '#a45cff'], art: 'waves', duration: 197 },
    { title: 'Paper Planes at Dusk', artist: 'Mira Sol', source: 'Amazon Music', colors: ['#ffd36e', '#ff8f6b', '#e2557a'], art: 'bloom', duration: 236 },
    { title: 'Ocean of Glass', artist: 'Halcyon', source: 'Media Player', colors: ['#5cf2b0', '#22b8d6', '#2a5fd0'], art: 'orb', duration: 251 },
    { title: 'Velvet Static', artist: 'Noor Avenue', source: 'Spotify', colors: ['#ff7a9a', '#c56cf0', '#3b2a8f'], art: 'grid', duration: 189 },
  ];

  // One player for the whole page, like the one media session on a PC: skip a song in one
  // island and every island moves on.
  class Player {
    constructor(tracks) {
      this.tracks = tracks;
      this.index = 0;
      this.position = 62;
      this.playing = true;
      this.matchColors = true;
      this.subs = new Set();
      let last = performance.now();
      setInterval(() => {
        const now = performance.now();
        const elapsed = (now - last) / 1000;
        last = now;
        if (!this.playing) return;
        this.position += elapsed;
        if (this.position >= this.track.duration) this.next();
        else this.emit('tick');
      }, 250);
    }
    get track() { return this.tracks[this.index]; }
    on(fn) { this.subs.add(fn); return () => this.subs.delete(fn); }
    emit(type) { this.subs.forEach(fn => fn(type)); }
    play() { if (!this.playing) { this.playing = true; this.emit('state'); } }
    toggle() { this.playing = !this.playing; this.emit('state'); }
    next() { this.select((this.index + 1) % this.tracks.length); }
    prev() {
      if (this.position > 3) { this.position = 0; this.emit('tick'); return; }
      this.select((this.index - 1 + this.tracks.length) % this.tracks.length);
    }
    select(i) { this.index = i; this.position = 0; this.emit('track'); }
    setMatchColors(on) { this.matchColors = on; this.emit('colors'); }
  }

  const player = new Player(TRACKS);

  // Loudness for Siro's waveform: the visitor's microphone when they turn it on, otherwise
  // something that moves like speech (bursts of syllables over a low floor).
  const voice = {
    source: null,
    level(t) {
      if (this.source) return this.source();
      const syllables = Math.max(0, Math.sin(t * 9.1) * (0.55 + 0.45 * Math.sin(t * 2.2 + 1)));
      return Math.min(1, 0.08 + syllables * 0.8 + Math.random() * 0.18 * syllables);
    },
  };

  // ---- Spring -----------------------------------------------------------------------------

  class Spring {
    constructor(value) { this.x = value; this.v = 0; this.target = value; }
    step(dt, omega, zeta) {
      const a = -omega * omega * (this.x - this.target) - 2 * zeta * omega * this.v;
      this.v += a * dt;
      this.x += this.v * dt;
    }
    settled() { return Math.abs(this.x - this.target) < 0.05 && Math.abs(this.v) < 0.5; }
    snap() { this.x = this.target; this.v = 0; }
  }

  // ---- The island ---------------------------------------------------------------------------

  const IDLE = [124, 32, 16];

  class Island {
    constructor(stage, options = {}) {
      this.stage = stage;
      this.options = options;
      stage.classList.add('island-stage');
      stage.innerHTML =
        '<div class="island-scaler">' +
          '<div class="island">' +
            '<div class="island-glass"></div><div class="island-glow"></div>' +
            '<div class="island-views"></div><div class="island-sheen"></div>' +
          '</div>' +
          '<div class="island-bubble" aria-hidden="true"><i class="dot mic"></i><i class="dot cam"></i></div>' +
        '</div>';
      this.el = stage.querySelector('.island');
      this.viewsEl = stage.querySelector('.island-views');
      this.bubble = stage.querySelector('.island-bubble');
      this.springs = { w: new Spring(IDLE[0]), h: new Spring(IDLE[1]), r: new Spring(IDLE[2]) };
      this.omega = 17;
      this.zeta = 0.68;
      this.current = null;
      this.currentEl = null;
      this.cleanup = null;
      this.raf = 0;
      this.tick = this.tick.bind(this);
      this.paint();

      if (options.music) {
        player.on(type => { if (type !== 'tick') this.paintMusic(); });
        this.paintMusic();
      }

      this.el.addEventListener('click', e => {
        const button = e.target.closest('[data-act]');
        if (button && this.el.contains(button)) {
          e.stopPropagation();
          this.onAction?.(button.dataset.act, button);
        }
      });
    }

    // Neutral: plain dark glass even though music is playing (an island showing nothing).
    setNeutral(on) {
      this.neutral = on;
      this.paintMusic();
    }

    paintMusic() {
      const style = this.el.style;
      if (player.matchColors && !this.neutral) {
        const c = colorsFor(player.track);
        style.setProperty('--tint', c.tint);
        style.setProperty('--accent', c.accent);
        style.setProperty('--g1', c.g1);
        style.setProperty('--g2', c.g2);
        style.setProperty('--glow', '0.55');
      } else {
        ['--tint', '--accent', '--g1', '--g2', '--glow'].forEach(p => style.removeProperty(p));
      }
    }

    show(view) {
      if (!view) return;
      if (this.current && view.key === this.current.key) {
        this.current = view;
        view.apply?.(this.currentEl);
        this.resize(view.shape);
        return;
      }
      this.cleanup?.();
      this.cleanup = null;

      const old = this.currentEl;
      if (old) {
        old.classList.remove('iv-in');
        old.classList.add('iv-out');
        setTimeout(() => old.remove(), 320);
      }

      const el = document.createElement('div');
      el.className = 'iv ' + (view.cls || '');
      el.style.width = view.shape[0] + 'px';
      el.style.height = view.shape[1] + 'px';
      el.innerHTML = view.html || '';
      this.viewsEl.appendChild(el);
      this.current = view;
      this.currentEl = el;
      view.apply?.(el);
      this.cleanup = view.mount?.(el, this) || null;
      el.getBoundingClientRect(); // start the entrance transition from its hidden state
      el.classList.add('iv-in');
      this.resize(view.shape);
    }

    setBubble(mic, camera) {
      this.bubble.classList.toggle('on', mic || camera);
      this.bubble.classList.toggle('has-mic', mic);
      this.bubble.classList.toggle('has-cam', camera);
    }

    resize([w, h, r]) {
      const s = this.springs;
      // Growing is a little bouncy, like a phone's island; shrinking settles faster.
      const expanding = w * h > s.w.target * s.h.target + 1;
      this.zeta = expanding ? 0.68 : 0.85;
      this.omega = expanding ? 17 : 21;
      s.w.target = w;
      s.h.target = h;
      s.r.target = r;
      if (reduceMotion) {
        Object.values(s).forEach(spring => spring.snap());
        this.paint();
        return;
      }
      if (!this.raf) {
        this.last = performance.now();
        this.raf = requestAnimationFrame(this.tick);
      }
    }

    tick(now) {
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      const steps = Math.max(1, Math.ceil(dt * 240));
      const s = this.springs;
      for (let i = 0; i < steps; i++) {
        s.w.step(dt / steps, this.omega, this.zeta);
        s.h.step(dt / steps, this.omega, this.zeta);
        s.r.step(dt / steps, this.omega, this.zeta);
      }
      if (s.w.settled() && s.h.settled() && s.r.settled()) {
        Object.values(s).forEach(spring => spring.snap());
        this.paint();
        this.raf = 0;
        return;
      }
      this.paint();
      this.raf = requestAnimationFrame(this.tick);
    }

    paint() {
      const { w, h, r } = this.springs;
      const width = Math.max(20, w.x);
      const height = Math.max(20, h.x);
      this.el.style.width = width + 'px';
      this.el.style.height = height + 'px';
      this.el.style.borderRadius = Math.min(r.x, height / 2, width / 2) + 'px';
      this.bubble.style.setProperty('--bx', (width / 2 + 6) + 'px');
    }
  }

  // ---- Views ----------------------------------------------------------------------------------
  // Each returns { key, shape: [width, height, radius], html, cls, apply(el), mount(el) }.
  // Showing a view with the same key as the current one updates it in place (apply).

  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const fmt = sec => { sec = Math.max(0, Math.floor(sec)); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; };

  function artHTML(track, size) {
    const [a, b, c] = track.colors;
    return `<div class="art art-${track.art} ${size}" style="--c1:${a};--c2:${b};--c3:${c}"></div>`;
  }

  function tabsHTML(active) {
    const first = player.playing ? ICON.note : ICON.clock;
    const tab = (i, icon, label) =>
      `<button class="tab${i === active ? ' on' : ''}" data-act="tab:${i}" aria-label="${label}">${icon}</button>`;
    return `<div class="tabs">${tab(0, first, 'Music')}${tab(1, ICON.clipboard, 'Clipboard')}${tab(2, ICON.tray, 'File shelf')}` +
      `<span class="tab-sep"></span><button class="tab" data-act="siro" aria-label="Siro">${ICON.mic}</button></div>`;
  }

  // Keeps a media view in step with the player: artwork, titles, progress, play state.
  function bindMedia(el) {
    let shownTrack = -1;
    const q = sel => el.querySelector(sel);
    const update = () => {
      const t = player.track;
      el.classList.toggle('paused', !player.playing);
      if (shownTrack !== player.index) {
        shownTrack = player.index;
        const slot = q('.art-slot');
        if (slot) slot.innerHTML = artHTML(t, slot.dataset.size || 'sm');
        if (q('.me-title')) {
          q('.me-title').textContent = t.title;
          q('.me-artist').textContent = t.artist;
          q('.me-src').textContent = t.source;
        }
      }
      if (q('.me-fill')) {
        q('.me-fill').style.width = (100 * player.position / t.duration).toFixed(2) + '%';
        q('.me-el').textContent = fmt(player.position);
        q('.me-rem').textContent = '-' + fmt(t.duration - player.position);
      }
      const toggle = q('[data-act="toggle"]');
      if (toggle) {
        toggle.innerHTML = player.playing ? ICON.pause : ICON.play;
        toggle.setAttribute('aria-label', player.playing ? 'Pause' : 'Play');
      }
    };
    update();
    return player.on(update);
  }

  const bars = n => `<div class="bars">${'<i></i>'.repeat(n)}</div>`;

  const CLIPBOARD = [
    { kind: 'text', text: 'Launch notes: ship on the 14th, tell everyone ✨', when: 'now' },
    { kind: 'link', text: 'figma.com/file/island-glass-v3', when: '2m' },
    { kind: 'image', text: 'Screenshot 2026-10-08 at 21.41.png', when: '9m' },
    { kind: 'text', text: 'Sunrise palette: #FFD98A #F4B94F #FF8FAB', when: '24m' },
    { kind: 'file', text: 'Pitch deck final (really).pdf', when: '1h' },
  ];

  const SHELF = [
    { kind: 'file', name: 'Proposal.pdf' },
    { kind: 'image', name: 'Sunrise.png' },
    { kind: 'folder', name: 'Photos' },
    { kind: 'file', name: 'Notes.txt' },
  ];

  function clipRows(items) {
    return items.map((item, i) => {
      const thumb = item.kind === 'image'
        ? '<span class="clip-thumb"></span>'
        : `<span class="clip-ic">${ICON[item.kind]}</span>`;
      return `<button class="clip-row" data-act="clip:${i}">${thumb}<span class="clip-text">${esc(item.text)}</span><span class="clip-when">${item.when}</span></button>`;
    }).join('');
  }

  function shelfTiles(items) {
    if (!items.length) return `<div class="shelf-empty">${ICON.tray}<span>Drop files here</span></div>`;
    return items.slice(0, 8).map(item =>
      `<div class="shelf-tile k-${item.kind}"><span class="shelf-ic">${ICON[item.kind]}</span><span class="shelf-name">${esc(item.name)}</span></div>`
    ).join('');
  }

  const V = {
    idle: () => ({ key: 'idle', shape: IDLE, html: '' }),

    mediaCompact: () => ({
      key: 'media-compact', shape: [250, 34, 17], cls: 'v-mc',
      html: `<div class="art-slot" data-size="sm"></div>${bars(4)}`,
      mount: bindMedia,
    }),

    mediaExpanded: (withTabs = false) => ({
      key: 'media-expanded' + (withTabs ? '-tabs' : ''),
      shape: withTabs ? [420, 206, 38] : [420, 172, 38],
      cls: 'v-me' + (withTabs ? ' with-tabs' : ''),
      html: (withTabs ? tabsHTML(0) : '') +
        `<div class="me-top"><div class="art-slot" data-size="lg"></div>` +
        `<div class="me-meta"><b class="me-title"></b><span class="me-artist"></span><small class="me-src"></small></div>${bars(4)}</div>` +
        `<div class="me-progress"><span class="me-el">0:00</span><div class="me-track"><i class="me-fill"></i></div><span class="me-rem">-0:00</span></div>` +
        `<div class="me-controls"><button class="ib" data-act="prev" aria-label="Previous">${ICON.prev}</button>` +
        `<button class="ib big" data-act="toggle" aria-label="Pause">${ICON.pause}</button>` +
        `<button class="ib" data-act="next" aria-label="Next">${ICON.next}</button></div>`,
      mount: bindMedia,
    }),

    clock: (withTabs = false) => ({
      key: 'clock' + (withTabs ? '-tabs' : ''),
      shape: withTabs ? [300, 126, 30] : [300, 92, 30],
      cls: 'v-clock' + (withTabs ? ' with-tabs' : ''),
      html: (withTabs ? tabsHTML(0) : '') + '<div class="clock-body"><b class="clock-time"></b><span class="clock-date"></span></div>',
      mount: el => {
        const update = () => {
          const now = new Date();
          el.querySelector('.clock-time').textContent = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
          el.querySelector('.clock-date').textContent = now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
        };
        update();
        const timer = setInterval(update, 5000);
        return () => clearInterval(timer);
      },
    }),

    clipboard: (items = CLIPBOARD) => ({
      key: 'clipboard', shape: [420, 226, 32], cls: 'v-clip with-tabs',
      html: tabsHTML(1) + `<div class="clip-list">${clipRows(items)}</div>`,
    }),

    shelf: (items = SHELF) => ({
      key: 'shelf', shape: [420, 216, 32], cls: 'v-shelf with-tabs',
      html: tabsHTML(2) + `<div class="shelf-grid">${shelfTiles(items)}</div>`,
      apply: el => { el.querySelector('.shelf-grid').innerHTML = shelfTiles(items); },
    }),

    level: (kind, value) => ({
      key: 'level-' + kind, shape: [250, 34, 17], cls: 'v-level',
      html: `<span class="ic"></span><div class="lv-track"><i class="lv-fill"></i></div><span class="lv-val"></span>`,
      apply: el => {
        el.querySelector('.ic').innerHTML = kind === 'volume' ? (value === 0 ? ICON.mute : ICON.volume) : ICON.sun;
        el.querySelector('.lv-fill').style.width = value + '%';
        el.querySelector('.lv-val').textContent = value;
      },
    }),

    battery: (percent, state = 'charging') => {
      const look = {
        charging: { label: 'Charging', color: '#30d158', icon: ICON.bolt },
        full: { label: 'Fully charged', color: '#30d158', icon: ICON.bolt },
        low: { label: 'Low battery', color: '#ff453a', icon: ICON.battery },
      }[state];
      return {
        key: 'battery-' + state, shape: [260, 34, 17], cls: 'v-bat',
        html: `<span class="ic" style="color:${look.color}">${look.icon}</span><b class="bat-label">${look.label}</b>` +
          `<b class="bat-pct" style="color:${look.color}">${percent}%</b>${batteryIcon(percent, look.color)}`,
      };
    },

    bluetooth: (name, percent, connected = true) => ({
      key: 'bt-' + (connected ? 'on' : 'off'), shape: [300, 34, 17], cls: 'v-bt' + (connected ? '' : ' off'),
      html: `<span class="ic">${ICON.headphones}</span><b class="bt-name">${esc(name)}</b>` +
        (connected ? `<span class="bt-status">${percent}%</span>${batteryIcon(percent, '#30d158')}` : '<span class="bt-status">Disconnected</span>'),
    }),

    privacy: (app, what = 'Microphone') => {
      const camera = what === 'Camera';
      return {
        key: 'privacy-' + app + what, shape: [300, 34, 17], cls: 'v-priv' + (camera ? ' cam' : ''),
        html: `<span class="ic">${camera ? ICON.camera : ICON.mic}</span><b class="pv-app">${esc(app)}</b><b class="pv-what">${what}</b>`,
      };
    },

    notification: n => ({
      key: 'notif-' + n.title, shape: [380, 56, 28], cls: 'v-notif',
      html: `<span class="nt-icon" style="--a:${n.colors[0]};--b:${n.colors[1]}">${n.letter}</span>` +
        `<div class="nt-text"><div class="nt-head"><b>${esc(n.title)}</b><span>${esc(n.app)}</span></div><span class="nt-body">${esc(n.body)}</span></div>`,
    }),

    notificationExpanded: n => ({
      key: 'notif-x-' + n.title, shape: [420, 190, 34], cls: 'v-notif-x',
      html: `<div class="nx-head"><span class="nt-icon" style="--a:${n.colors[0]};--b:${n.colors[1]}">${n.letter}</span>` +
        `<div><b>${esc(n.title)}</b><span>${esc(n.app)} · now</span></div></div>` +
        `<p class="nx-body">${esc(n.long || n.body)}</p>` +
        `<div class="nx-actions"><button class="nx-btn primary" data-act="open">Open</button><button class="nx-btn" data-act="clear">Clear</button></div>`,
    }),

    siroListening: () => ({
      key: 'siro-listen', shape: [250, 36, 18], cls: 'v-siro',
      html: `<span class="orb listening"></span><div class="wave">${'<i></i>'.repeat(23)}</div>`,
      mount: el => {
        const barsEl = [...el.querySelectorAll('.wave i')];
        const half = Math.ceil(barsEl.length / 2);
        const history = new Array(half).fill(0);
        let raf = 0;
        let lastPush = 0;
        const frame = now => {
          if (!el.isConnected) return;
          if (now - lastPush > 45) {
            lastPush = now;
            history.unshift(voice.level(now / 1000));
            history.length = half;
          }
          // Newest in the middle, spreading out to both ends.
          barsEl.forEach((bar, i) => {
            const d = Math.abs(i - (barsEl.length - 1) / 2);
            const v = history[Math.round(d)] || 0;
            bar.style.height = (3 + v * 19 * (1 - d / (half * 1.6))).toFixed(1) + 'px';
          });
          raf = requestAnimationFrame(frame);
        };
        raf = requestAnimationFrame(frame);
        return () => cancelAnimationFrame(raf);
      },
    }),

    siroThinking: (text = 'Thinking…') => ({
      key: 'siro-think', shape: [190, 36, 18], cls: 'v-siro',
      html: `<span class="orb thinking"></span><span class="siro-status">${esc(text)}</span>`,
    }),

    siroAnswer: (heard, reply) => ({
      key: 'siro-answer-' + reply, shape: reply.length > 42 ? [380, 74, 26] : [380, 56, 24], cls: 'v-siro answer',
      html: `<span class="orb"></span><div class="siro-ans"><span class="siro-heard">“${esc(heard)}”</span><b class="siro-reply">${esc(reply)}</b></div>`,
    }),
  };

  // ---- Director: decides what an island shows ---------------------------------------------
  // Hovered: the expanded view. Otherwise whatever a running script asks for (a notice that
  // comes and goes), or the island's base view.

  class Director {
    constructor(island, { base, expanded = null, hoverable = !!expanded } = {}) {
      this.island = island;
      this.base = base;
      this.expanded = expanded;
      this.transient = null;
      this.hovered = false;
      this.forced = false;
      this.tab = 0;
      this.token = 0;
      this.running = 0;
      this.pauseUntil = 0;
      this.visible = false; // until the observer below says otherwise
      this.canAutoplay = () => true;
      island.onAction = (act, button) => this.action(act, button);

      if (hoverable) {
        let enterTimer, leaveTimer;
        island.el.addEventListener('pointerenter', e => {
          if (e.pointerType === 'touch') return;
          clearTimeout(leaveTimer);
          enterTimer = setTimeout(() => this.setHover(true), 90);
        });
        island.el.addEventListener('pointerleave', e => {
          if (e.pointerType === 'touch') return;
          clearTimeout(enterTimer);
          leaveTimer = setTimeout(() => this.setHover(false), 280);
        });
        // Touch: tap to open, tap anywhere else to close.
        island.el.addEventListener('click', e => {
          if (!this.hovered && !e.target.closest('[data-act], a')) this.setHover(true);
        });
        document.addEventListener('pointerdown', e => {
          if (this.hovered && e.pointerType === 'touch' && !island.el.contains(e.target)) this.setHover(false);
        });
      }

      new IntersectionObserver(entries => {
        this.visible = entries[entries.length - 1].isIntersecting;
      }).observe(island.stage);

      this.refresh();
    }

    setHover(on) {
      if (this.hovered === on) return;
      this.hovered = on;
      if (!on) this.tab = 0;
      this.onHover?.(on);
      this.refresh();
    }

    refresh() {
      let view;
      if ((this.hovered || this.forced) && this.expanded) view = this.expanded(this.tab);
      else view = this.transient || this.base();
      this.island.show(view);
    }

    action(act, button) {
      if (act.startsWith('tab:')) { this.tab = Number(act.slice(4)); this.refresh(); return; }
      if (act === 'toggle') player.toggle();
      else if (act === 'next') player.next();
      else if (act === 'prev') player.prev();
      this.onAction?.(act, button);
    }

    // Runs a little story on the island; a newer one (or stop) cancels it. Scripts await
    // wait(ms), which resolves to false once they've been cancelled.
    run(script) {
      const token = ++this.token;
      this.running = token;
      this.island.setBubble(false, false);
      const alive = () => token === this.token;
      const show = view => { if (alive()) { this.transient = view; this.refresh(); } };
      const wait = ms => sleep(ms).then(alive);
      return Promise.resolve()
        .then(() => script({ show, wait, alive, island: this.island, director: this }))
        .catch(err => console.error(err))
        .finally(() => {
          if (!alive()) return;
          this.transient = null;
          this.running = 0;
          this.island.setBubble(false, false);
          this.refresh();
        });
    }

    stop() {
      this.token++;
      this.running = 0;
      this.transient = null;
      this.island.setBubble(false, false);
      this.refresh();
    }

    // Plays the scripts in turn, forever, whenever the island is on screen and nobody's
    // using it.
    async autoplay(scripts, { gap = 2200, start = 1400 } = {}) {
      let i = 0;
      await sleep(start);
      for (;;) {
        const free = this.visible && !document.hidden && !this.running && !this.hovered && !this.forced &&
          Date.now() > this.pauseUntil && this.canAutoplay();
        if (!free) { await sleep(400); continue; }
        await this.run(scripts[i++ % scripts.length]);
        await sleep(gap);
      }
    }
  }

  window.WI = { Island, Director, V, ICON, TRACKS, CLIPBOARD, SHELF, player, voice, colorsFor, artHTML, batteryIcon, reduceMotion, sleep, esc };
})();
