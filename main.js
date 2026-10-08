/* WinIsland website: everything on the page that isn't the island itself. */
(function () {
  'use strict';

  const { Island, Director, V, ICON, TRACKS, player, voice, artHTML, reduceMotion, sleep, esc } = window.WI;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  // Where the waitlist forms send the email, as JSON: { "email": "..." }. Any form backend that
  // accepts a JSON POST works (Formspree, Buttondown, a Cloudflare Worker, your own API).
  // While this is empty, nothing is sent anywhere: the forms only show their thank-you state.
  const WAITLIST_ENDPOINT = '';

  $$('[data-icon]').forEach(el => { el.innerHTML = ICON[el.dataset.icon] || ''; });
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  // ---- Content shared by several islands ---------------------------------------------------

  const MESSAGES = [
    {
      app: 'Messages', title: 'Priya', letter: 'P', colors: ['#ff9a8b', '#ff5f8f'],
      body: 'Dinner at 8? I found the perfect place 🌅',
      long: 'Dinner at 8? I found the perfect place by the lake, the one with the fairy lights. Booking for four unless you say no 🌅',
    },
    {
      app: 'Calendar', title: 'Design review', letter: '9', colors: ['#7aa2ff', '#7a5cff'],
      body: 'Starts in 10 minutes · Room Skylight',
      long: 'Starts in 10 minutes in Room Skylight. On the agenda: the island glass, the new tabs, and launch-day colours.',
    },
    {
      app: 'Mail', title: 'Arjun', letter: 'A', colors: ['#5cf2b0', '#22a6d6'],
      body: 'The new build is ready to try ✨',
      long: 'The new build is ready to try ✨ Start with the file shelf. Dragging things onto the island is ridiculously satisfying.',
    },
  ];

  const levelScript = (kind, steps) => async ({ show, wait }) => {
    for (const value of steps) {
      show(V.level(kind, value));
      if (!await wait(330)) return;
    }
    await wait(1500);
  };

  const siroScript = (heard, reply, effect) => async ({ show, wait }) => {
    show(V.siroListening());
    if (!await wait(1800)) return;
    show(V.siroThinking());
    if (!await wait(600)) return;
    const text = typeof reply === 'function' ? reply() : reply;
    show(V.siroAnswer(heard, text));
    effect?.();
    await wait(text.length > 42 ? 4400 : 2700);
  };

  const timeNow = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const greet = siroScript('Hey Siro', 'Hi! Try “next song”, “volume 30” or “open Chrome”.');

  // Hovering an island with music opens it, with tabs for the clipboard and file shelf.
  function expandedView(tab) {
    if (tab === 1) return V.clipboard();
    if (tab === 2) return V.shelf();
    return V.mediaExpanded(true);
  }

  // Clicking a clipboard row "copies" it.
  function flashCopied(button) {
    const when = button.querySelector('.clip-when');
    const before = when.textContent;
    button.classList.add('copied');
    when.textContent = 'Copied';
    setTimeout(() => { button.classList.remove('copied'); when.textContent = before; }, 1200);
  }

  function islandActions(director) {
    director.onAction = (act, button) => {
      if (act.startsWith('clip:')) flashCopied(button);
      else if (act === 'siro') { director.setHover(false); director.run(greet); }
    };
  }

  // ---- Navigation island ------------------------------------------------------------------------

  const SECTIONS = [
    { id: 'top', label: 'WinIsland' },
    { id: 'how', label: 'How it works', sub: 'Lives at the top', icon: 'sparkle' },
    { id: 'features', label: 'Features', sub: 'Live activities', icon: 'grid' },
    { id: 'music', label: 'Music', sub: 'Colour that listens', icon: 'note' },
    { id: 'siro', label: 'Siro', sub: 'Voice assistant', icon: 'mic' },
    { id: 'privacy', label: 'Privacy', sub: 'Private by design', icon: 'shield' },
    { id: 'pricing', label: 'Pricing', sub: 'Free and Pro', icon: 'tag' },
    { id: 'faq', label: 'FAQ', sub: 'Good questions', icon: 'question' },
    { id: 'founder', label: 'Founder’s note', menu: false },
    { id: 'waitlist', label: 'Waitlist', sub: 'Get early access', icon: 'bell', cta: true },
  ];
  let currentSection = SECTIONS[0];

  const measure = (() => {
    const ctx = document.createElement('canvas').getContext('2d');
    return text => {
      ctx.font = '600 13px "Segoe UI Variable Text", "Segoe UI", Inter, sans-serif';
      return ctx.measureText(text).width;
    };
  })();

  function scrollProgress() {
    const max = document.documentElement.scrollHeight - innerHeight;
    return max > 0 ? Math.min(1, scrollY / max) : 0;
  }

  function navCompact(section) {
    const width = Math.round(measure(section.label) + 82);
    return {
      key: 'nav-' + section.id, shape: [Math.max(140, width), 34, 17], cls: 'v-navc',
      html: '<svg class="ring" viewBox="0 0 20 20" aria-hidden="true"><circle class="ring-bg" cx="10" cy="10" r="8"/><circle class="ring-fg" cx="10" cy="10" r="8" pathLength="100"/></svg>' +
        `<b>${esc(section.label)}</b><span class="ic">${ICON.grid}</span>`,
      apply: el => { el.querySelector('.ring-fg').style.strokeDashoffset = (100 - scrollProgress() * 100).toFixed(1); },
    };
  }

  function navMenu() {
    const links = SECTIONS.slice(1).filter(s => s.menu !== false).map(s =>
      `<a href="#${s.id}" class="${s.cta ? 'cta' : ''}${s.id === currentSection.id ? ' here' : ''}">` +
      `<span class="m-ic">${ICON[s.icon]}</span><span><b>${s.label}</b><small>${s.sub}</small></span></a>`
    ).join('');
    return { key: 'nav-menu', shape: [420, 202, 30], cls: 'v-menu', html: links };
  }

  const navIsland = new Island($('#nav-island'));
  const nav = new Director(navIsland, {
    base: () => (scrollY < 140 ? V.idle() : navCompact(currentSection)),
    expanded: navMenu,
  });
  islandActions(nav);
  navIsland.el.addEventListener('click', e => { if (e.target.closest('a')) nav.setHover(false); });

  const topbar = $('.topbar');
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      currentSection = SECTIONS.find(s => s.id === id) || SECTIONS[0];
      topbar.classList.toggle('on-night', id === 'siro' || id === 'privacy');
      nav.refresh();
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('[data-section]').forEach(section => sectionObserver.observe(section));

  // ---- Hero ----------------------------------------------------------------------------------

  const heroIsland = new Island($('#hero-island'), { music: true });
  const hero = new Director(heroIsland, { base: () => V.mediaCompact(), expanded: expandedView });
  islandActions(hero);

  const heroScripts = {
    music: async ({ show, wait }) => { player.play(); show(V.mediaExpanded(true)); await wait(4600); },
    notification: async ({ show, wait }) => { show(V.notification(MESSAGES[0])); await wait(4200); },
    volume: levelScript('volume', [36, 48, 60, 68]),
    brightness: levelScript('brightness', [72, 60, 48]),
    bluetooth: async ({ show, wait }) => { show(V.bluetooth('Aurora Buds Pro', 80)); await wait(3200); },
    battery: async ({ show, wait }) => { show(V.battery(64)); await wait(3000); },
    privacy: async ({ show, wait, island }) => {
      island.setBubble(true, false);
      show(V.privacy('Discord'));
      if (!await wait(2800)) return;
      show(null); // back to the music; the dot stays while the app keeps the mic
      await wait(2600);
    },
    siro: siroScript('Next song', 'Next track.', () => player.next()),
  };

  // Light up the chip of whatever the island is showing, so it's clear the chips do that.
  const chipFor = name => $(`.try .chip[data-demo="${name}"]`);
  const tagged = name => async ctx => {
    $$('.try .chip.active').forEach(c => c.classList.remove('active'));
    chipFor(name)?.classList.add('active');
    try { await heroScripts[name](ctx); } finally { if (ctx.alive()) chipFor(name)?.classList.remove('active'); }
  };

  $$('.try .chip').forEach(chip => chip.addEventListener('click', () => {
    hero.pauseUntil = Date.now() + 8000;
    hero.setHover(false);
    hero.run(tagged(chip.dataset.demo));
  }));

  const hint = $('.hover-hint');
  const noHover = matchMedia('(hover: none)');
  const labelHint = () => { hint.lastChild.textContent = noHover.matches ? 'Tap the island' : 'Hover the island'; };
  labelHint();
  noHover.addEventListener('change', labelHint);
  hero.onHover = on => { if (on) hint.classList.add('gone'); };
  hero.autoplay(['notification', 'volume', 'bluetooth', 'siro', 'battery', 'privacy', 'brightness'].map(tagged), { gap: 2600, start: 2400 });

  // Taskbar clock
  const updateClocks = () => {
    const now = new Date();
    $$('[data-clock-time]').forEach(el => { el.textContent = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); });
    $$('[data-clock-date]').forEach(el => { el.textContent = now.toLocaleDateString(); });
  };
  updateClocks();
  setInterval(updateClocks, 10000);

  // A soft light that follows the pointer across the hero sky.
  const heroEl = $('.hero');
  if (!reduceMotion) {
    let pending = null;
    heroEl.addEventListener('pointermove', e => {
      if (pending) return;
      pending = requestAnimationFrame(() => {
        const r = heroEl.getBoundingClientRect();
        heroEl.style.setProperty('--cx', (e.clientX - r.left) + 'px');
        heroEl.style.setProperty('--cy', (e.clientY - r.top) + 'px');
        pending = null;
      });
    });
  }

  // ---- Story: how it lives -------------------------------------------------------------------

  const storyScreen = $('#story-screen');
  const storyIsland = new Island($('#story-island'), { music: true });
  let storyStep = 0;
  const story = new Director(storyIsland, {
    base: () => (storyStep === 0 ? V.idle() : V.mediaCompact()),
    expanded: expandedView,
  });
  islandActions(story);
  story.canAutoplay = () => storyStep === 1;
  story.autoplay([
    async ({ show, wait }) => { show(V.bluetooth('Aurora Buds Pro', 80)); await wait(2600); },
    levelScript('volume', [40, 52, 64]),
    async ({ show, wait }) => { show(V.battery(64)); await wait(2400); },
    async ({ show, wait }) => { show(V.notification(MESSAGES[1])); await wait(3200); },
  ], { gap: 1600, start: 300 });

  function setStoryStep(step) {
    if (step === storyStep) return;
    storyStep = step;
    storyScreen.dataset.step = step;
    $$('.story-steps li').forEach(li => li.classList.toggle('on', Number(li.dataset.step) === step));
    $$('.story-dots i').forEach((dot, i) => dot.classList.toggle('on', i === step));
    if (step !== 1) story.stop();
    storyIsland.setNeutral(step === 0);
    story.forced = step === 2;
    story.tab = 0;
    story.refresh();
  }
  $('.story-steps li').classList.add('on');
  storyIsland.setNeutral(true);
  const stepObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) setStoryStep(Number(entry.target.dataset.step)); });
  }, { rootMargin: '-48% 0px -48% 0px' });
  $$('.story-steps li').forEach(li => stepObserver.observe(li));

  // ---- Feature cards ---------------------------------------------------------------------------

  const card = name => $(`[data-card="${name}"]`);

  // Now playing: the full player, always open.
  new Director(new Island(card('music'), { music: true }), { base: () => V.mediaExpanded(false) });

  // Notifications: hover the banner to read it all.
  let messageIndex = 0;
  const notif = new Director(new Island(card('notification')), {
    base: () => V.notification(MESSAGES[messageIndex]),
    expanded: () => V.notificationExpanded(MESSAGES[messageIndex]),
  });
  const nextMessage = async ({ show, wait }) => {
    show(V.idle());
    if (!await wait(900)) return;
    messageIndex = (messageIndex + 1) % MESSAGES.length;
  };
  notif.onAction = act => {
    if (act === 'open' || act === 'clear') { notif.setHover(false); notif.run(nextMessage); }
  };
  notif.autoplay([nextMessage], { gap: 4200, start: 4200 });

  // Volume and brightness over the music.
  const level = new Director(new Island(card('level'), { music: true }), { base: () => V.mediaCompact() });
  level.autoplay([levelScript('volume', [30, 44, 58, 70]), levelScript('brightness', [82, 66, 50])], { gap: 1600, start: 700 });

  // Battery: charging, full, low.
  const battery = new Director(new Island(card('battery')), { base: () => V.idle() });
  battery.autoplay([
    async ({ show, wait }) => { show(V.battery(64, 'charging')); await wait(2800); },
    async ({ show, wait }) => { show(V.battery(100, 'full')); await wait(2600); },
    async ({ show, wait }) => { show(V.battery(20, 'low')); await wait(2600); },
  ], { gap: 1100, start: 900 });

  // Bluetooth: earbuds connect, a speaker leaves.
  const bluetooth = new Director(new Island(card('bluetooth')), { base: () => V.idle() });
  bluetooth.autoplay([
    async ({ show, wait }) => { show(V.bluetooth('Aurora Buds Pro', 80)); await wait(3000); },
    async ({ show, wait }) => { show(V.bluetooth('Living Room Speaker', 0, false)); await wait(2400); },
  ], { gap: 1100, start: 1100 });

  // Clipboard: the tabs work, rows "copy".
  const clipboard = new Director(new Island(card('clipboard'), { music: true }), { base() { return expandedView(this.tab); } });
  clipboard.tab = 1;
  clipboard.refresh();
  islandActions(clipboard);

  // Microphone and camera.
  const privacy = new Director(new Island(card('privacy')), { base: () => V.idle() });
  privacy.autoplay([
    async ({ show, wait, island }) => {
      island.setBubble(true, false);
      show(V.privacy('Discord'));
      if (!await wait(2600)) return;
      show(null);
      await wait(2200);
    },
    async ({ show, wait, island }) => {
      island.setBubble(true, true);
      show(V.privacy('Zoom', 'Camera'));
      if (!await wait(2600)) return;
      show(null);
      await wait(2200);
    },
  ], { gap: 900, start: 1300 });

  // Fullscreen: a film takes over and the island steps aside.
  const fsDemo = $('.fs-demo');
  const fsLabel = $('.fs-label');
  const fs = new Director(new Island(card('fullscreen'), { music: true }), { base: () => V.mediaCompact() });
  let fullscreen = false;
  fsLabel.textContent = 'On the desktop';
  setInterval(() => {
    if (!fs.visible || document.hidden) return;
    fullscreen = !fullscreen;
    fsDemo.dataset.full = fullscreen ? '1' : '0';
    fsLabel.textContent = fullscreen ? 'Fullscreen film: island hidden' : 'On the desktop';
  }, 3200);

  // ---- File shelf: drag files onto the island ------------------------------------------------

  const shelfDemo = $('.shelf-demo');
  const shelfIsland = new Island(card('shelf'));
  const shelfItems = [];
  const shelf = new Director(shelfIsland, { base: () => (shelfItems.length ? V.shelf(shelfItems) : V.idle()) });
  const dropView = over => ({
    key: over ? 'drop-over' : 'drop', shape: over ? [250, 44, 22] : [200, 34, 17], cls: 'v-drop',
    html: `<span class="ic">${ICON.tray}</span>${over ? 'Let go to shelve it' : 'Drop files here'}`,
  });

  function addToShelf(button) {
    shelfItems.push({ kind: button.dataset.kind, name: button.dataset.name });
    button.classList.add('used');
    shelfDemo.classList.add('has-items');
    shelf.transient = null;
    shelf.refresh();
    if (shelfItems.length === 3) setTimeout(resetShelf, 5200);
  }

  function resetShelf() {
    shelfItems.length = 0;
    $$('.drag-file').forEach(b => b.classList.remove('used'));
    shelfDemo.classList.remove('has-items');
    shelf.refresh();
  }

  $$('.drag-file').forEach(button => {
    button.addEventListener('click', e => { if (e.detail === 0) addToShelf(button); }); // keyboard
    button.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      e.preventDefault();
      const startX = e.clientX, startY = e.clientY;
      let ghost = null, over = false;

      const overIsland = (x, y) => {
        const r = shelfIsland.el.getBoundingClientRect();
        const pad = 36;
        return x > r.left - pad && x < r.right + pad && y > r.top - pad && y < r.bottom + pad;
      };
      const move = ev => {
        if (!ghost) {
          if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < 5) return;
          ghost = button.cloneNode(true);
          ghost.classList.add('drag-ghost');
          document.body.appendChild(ghost);
          button.style.opacity = '.3';
          shelf.transient = dropView(false);
          shelf.refresh();
        }
        ghost.style.left = ev.clientX + 'px';
        ghost.style.top = ev.clientY + 'px';
        const now = overIsland(ev.clientX, ev.clientY);
        if (now !== over) { over = now; shelf.transient = dropView(over); shelf.refresh(); }
      };
      const up = () => {
        removeEventListener('pointermove', move);
        removeEventListener('pointerup', up);
        removeEventListener('pointercancel', up);
        button.style.opacity = '';
        if (!ghost) { addToShelf(button); return; } // a plain click
        if (over) {
          ghost.animate([{ opacity: 1 }, { opacity: 0, transform: 'translate(-50%, -50%) scale(.2)' }], { duration: 260, easing: 'ease-in' }).onfinish = () => ghost.remove();
          addToShelf(button);
        } else {
          const r = button.getBoundingClientRect();
          ghost.animate([
            { left: ghost.style.left, top: ghost.style.top },
            { left: r.left + r.width / 2 + 'px', top: r.top + r.height / 2 + 'px' },
          ], { duration: 380, easing: 'cubic-bezier(.2,.9,.3,1.2)' }).onfinish = () => ghost.remove();
          shelf.transient = null;
          shelf.refresh();
        }
      };
      addEventListener('pointermove', move);
      addEventListener('pointerup', up);
      addEventListener('pointercancel', up);
    });
  });

  // ---- Music colours ----------------------------------------------------------------------------

  const musicSection = $('#music');
  const musicDirector = new Director(new Island($('#music-island'), { music: true }), { base: () => V.mediaExpanded(false) });
  const albums = $('.albums');
  albums.innerHTML = TRACKS.map((t, i) =>
    `<button class="album" role="radio" aria-checked="false" data-i="${i}" aria-label="${esc(t.title)} by ${esc(t.artist)}">${artHTML(t, 'xl')}<span>${esc(t.title)}</span></button>`
  ).join('');
  albums.addEventListener('click', e => {
    const button = e.target.closest('.album');
    if (!button) return;
    player.select(Number(button.dataset.i));
    player.play();
  });

  function paintMusicSection() {
    const t = player.track;
    $$('.album', albums).forEach((b, i) => b.setAttribute('aria-checked', String(i === player.index)));
    const [a, b, c] = t.colors;
    musicSection.style.setProperty('--m1', a);
    musicSection.style.setProperty('--m2', b);
    musicSection.style.setProperty('--m3', c);
    $('[data-now-playing]').textContent = `${t.title}, ${t.artist}`;
  }
  player.on(type => { if (type !== 'tick') paintMusicSection(); });
  paintMusicSection();

  $('#match-colors').addEventListener('change', e => {
    player.setMatchColors(e.target.checked);
    musicSection.classList.toggle('neutral', !e.target.checked);
  });

  // ---- Siro ------------------------------------------------------------------------------------

  const siroIsland = new Island($('#siro-island'));
  const siro = new Director(siroIsland, { base: () => V.idle() });
  const SAY = {
    next: ['Next song', 'Next track.', () => player.next()],
    volume: ['Volume 30', 'Volume 30%.'],
    brightness: ['Make the screen dimmer', 'Brightness 40%.'],
    open: ['Open Chrome', 'Opening Google Chrome.'],
    time: ['What time is it?', () => `It's ${timeNow()}.`],
    lock: ['Lock my PC', 'Locked.'],
    help: ['What can you do?', 'I can play, pause and skip music, change the volume and brightness, open apps, tell the time, and lock your PC.'],
  };
  const sayButton = name => $(`.say[data-say="${name}"]`);
  const sayScript = name => async ctx => {
    $$('.say.active').forEach(b => b.classList.remove('active'));
    sayButton(name)?.classList.add('active');
    try { await siroScript(...SAY[name])(ctx); } finally { if (ctx.alive()) sayButton(name)?.classList.remove('active'); }
  };
  $$('.say').forEach(button => button.addEventListener('click', () => {
    stopMic(false);
    siro.pauseUntil = Date.now() + 9000;
    siro.run(sayScript(button.dataset.say));
  }));
  siro.autoplay(Object.keys(SAY).filter(k => k !== 'help').map(sayScript), { gap: 1800, start: 900 });

  // The glow behind the island breathes with the voice while Siro listens.
  const siroGlow = $('.siro-glow');
  if (!reduceMotion) {
    let smooth = 0;
    const breathe = now => {
      if (siro.visible) {
        const listening = siroIsland.current && siroIsland.current.key === 'siro-listen';
        smooth += ((listening ? voice.level(now / 1000) : 0) - smooth) * 0.2;
        siroGlow.style.setProperty('--lvl', smooth.toFixed(3));
      }
      requestAnimationFrame(breathe);
    };
    requestAnimationFrame(breathe);
  }

  // The real shortcut works here too.
  const keys = $('.keys');
  function summonSiro() {
    keys.classList.add('pressed');
    setTimeout(() => keys.classList.remove('pressed'), 180);
    const director = siro.visible ? siro : nav;
    director.pauseUntil = Date.now() + 8000;
    director.setHover(false);
    director.run(greet);
  }
  keys.addEventListener('click', summonSiro);
  keys.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); summonSiro(); } });
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.altKey && e.code === 'KeyS') { e.preventDefault(); summonSiro(); }
  });

  // "Try the waveform with your voice": loudness only, measured in the browser.
  const voiceButton = $('#voice-btn');
  const voiceLabel = $('.vb-label', voiceButton);
  let mic = null;

  async function startMic() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      context.createMediaStreamSource(stream).connect(analyser);
      const data = new Float32Array(analyser.fftSize);
      mic = { stream, context, timer: setTimeout(() => stopMic(true), 30000) };
      voice.source = () => {
        analyser.getFloatTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
        return Math.min(1, Math.sqrt(sum / data.length) * 10);
      };
      voiceButton.setAttribute('aria-pressed', 'true');
      voiceLabel.textContent = 'Listening… tap to stop';
      siro.run(async ({ show, wait }) => {
        show(V.siroListening());
        while (await wait(400)) { if (!mic) return; }
      });
    } catch (err) {
      voiceLabel.textContent = 'The microphone isn’t available here';
      setTimeout(() => { voiceLabel.textContent = 'Try the waveform with your voice'; }, 2600);
    }
  }

  function stopMic(answer) {
    if (!mic) return;
    clearTimeout(mic.timer);
    mic.stream.getTracks().forEach(track => track.stop());
    mic.context.close();
    mic = null;
    voice.source = null;
    voiceButton.setAttribute('aria-pressed', 'false');
    voiceLabel.textContent = 'Try the waveform with your voice';
    if (answer) {
      siro.pauseUntil = Date.now() + 6000;
      siro.run(async ({ show, wait }) => {
        show(V.siroThinking());
        if (!await wait(500)) return;
        show(V.siroAnswer('…', 'That waveform was you. In the app, I’d act on it.'));
        await wait(3400);
      });
    }
  }

  voiceButton.addEventListener('click', () => (mic ? stopMic(true) : startMic()));

  // Stars over the night sky.
  const stars = $('.stars');
  stars.innerHTML = Array.from({ length: 150 }, () => {
    const z = (Math.random() * 1.6 + .8).toFixed(1);
    return `<i style="left:${(Math.random() * 100).toFixed(2)}%;top:${(Math.random() * 100).toFixed(2)}%;--z:${z}px;` +
      `--t:${(2 + Math.random() * 4).toFixed(1)}s;--dl:${(-Math.random() * 6).toFixed(1)}s;--o:${(.5 + Math.random() * .5).toFixed(2)}"></i>`;
  }).join('');

  // ---- Final call ----------------------------------------------------------------------------

  const finale = new Director(new Island($('#final-island'), { music: true }), { base: () => V.mediaCompact() });
  finale.autoplay([
    async ({ show, wait }) => { show(V.bluetooth('Aurora Buds Pro', 80)); await wait(2800); },
    async ({ show, wait }) => { show(V.notification(MESSAGES[2])); await wait(3600); },
    async ({ show, wait }) => { show(V.battery(100, 'full')); await wait(2600); },
  ], { gap: 2200, start: 800 });

  // ---- Pricing currency ------------------------------------------------------------------------

  function setCurrency(currency, animate = true) {
    $$('.currency button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.cur === currency)));
    $$('.price b').forEach(price => {
      const value = price.dataset[currency];
      if (!animate) { price.textContent = value; return; }
      price.classList.add('swap');
      setTimeout(() => { price.textContent = value; price.classList.remove('swap'); }, 180);
    });
  }
  $$('.currency button').forEach(b => b.addEventListener('click', () => setCurrency(b.dataset.cur)));
  const zone = (Intl.DateTimeFormat().resolvedOptions().timeZone || '');
  setCurrency(/Kolkata|Calcutta/.test(zone) ? 'inr' : 'usd', false);

  // ---- Waitlist ------------------------------------------------------------------------------

  function burst(origin) {
    if (reduceMotion) return;
    const r = origin.getBoundingClientRect();
    for (let i = 0; i < 26; i++) {
      const spark = document.createElement('span');
      const size = 4 + Math.random() * 6;
      spark.style.cssText = `position:fixed;z-index:300;pointer-events:none;left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;` +
        `width:${size}px;height:${size}px;border-radius:50%;background:radial-gradient(circle,#fff8e0,#f2b544 60%,rgba(242,181,68,0));`;
      document.body.appendChild(spark);
      const angle = Math.random() * Math.PI * 2;
      const distance = 60 + Math.random() * 120;
      spark.animate([
        { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(angle) * distance}px), calc(-50% + ${Math.sin(angle) * distance - 40}px)) scale(.2)`, opacity: 0 },
      ], { duration: 900 + Math.random() * 600, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => spark.remove();
    }
  }

  const welcome = {
    app: 'WinIsland', title: 'You’re on the list', letter: '✦', colors: ['#ffd88a', '#f2b544'],
    body: 'We’ll email you the moment it’s ready.',
  };

  $$('[data-waitlist]').forEach(form => form.addEventListener('submit', async e => {
    e.preventDefault();
    const input = $('input', form);
    const message = $('.form-msg', form);
    const button = $('button', form);
    const label = $('span', button);
    const email = input.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      message.textContent = 'That email doesn’t look quite right.';
      message.classList.add('error');
      input.focus();
      return;
    }
    message.classList.remove('error');
    message.textContent = '';
    button.disabled = true;
    label.textContent = 'Joining…';
    try {
      if (WAITLIST_ENDPOINT) {
        const response = await fetch(WAITLIST_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ email }),
        });
        if (!response.ok) throw new Error('Waitlist signup failed: ' + response.status);
      } else {
        console.warn('WAITLIST_ENDPOINT is not set in main.js, so this email was not sent anywhere.');
        await sleep(500);
      }
      $$('[data-waitlist]').forEach(f => {
        f.classList.add('done');
        $('input', f).value = email;
        $('button', f).disabled = true;
        $('button span', f).textContent = 'You’re on the list ✓';
        $('.form-msg', f).textContent = 'Thank you! We’ll write the moment WinIsland is ready.';
      });
      burst(button);
      nav.setHover(false);
      nav.run(async ({ show, wait }) => { show(V.notification(welcome)); await wait(4500); });
    } catch (err) {
      console.error(err);
      message.textContent = 'Something went wrong. Please try again in a moment.';
      message.classList.add('error');
      button.disabled = false;
      label.textContent = 'Join the waitlist';
    }
  }));

  // ---- Fit every island to the room it has ----------------------------------------------------

  function fitIslands() {
    $$('.island-stage[data-max]').forEach(stage => {
      // data-fit: the widest view this island shows (expanded views are 420 wide).
      const room = stage.parentElement.clientWidth;
      const fit = parseFloat(stage.dataset.fit || 440);
      const scale = Math.max(0.5, Math.min(parseFloat(stage.dataset.max), (room - 12) / fit));
      stage.style.setProperty('--s', scale.toFixed(3));
    });
    const navScale = Math.min(1, (innerWidth - 24) / 430);
    $('#nav-island').style.setProperty('--s', navScale.toFixed(3));
    hint.style.setProperty('--hint-s', $('#hero-island').style.getPropertyValue('--s') || 1.45);
  }
  fitIslands();
  addEventListener('resize', fitIslands);

  // ---- Scroll: top bar, hero tilt, progress ring -------------------------------------------------

  const screenWrap = $('.hero .screen-wrap');
  let wasTop = true;
  let scrollQueued = false;
  function onScroll() {
    scrollQueued = false;
    const y = scrollY;
    topbar.classList.toggle('scrolled', y > 20);
    if (!reduceMotion) screenWrap.style.setProperty('--tilt', Math.max(0, 16 - y / 24).toFixed(2));
    const atTop = y < 140;
    if (atTop !== wasTop) { wasTop = atTop; nav.refresh(); }
    const ring = navIsland.currentEl && navIsland.currentEl.querySelector('.ring-fg');
    if (ring) ring.style.strokeDashoffset = (100 - scrollProgress() * 100).toFixed(1);
  }
  addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // ---- Reveal on scroll, card spotlight ------------------------------------------------------

  const revealer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('in'); revealer.unobserve(entry.target); }
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
  $$('.reveal').forEach(el => revealer.observe(el));

  $$('.card').forEach(el => el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    el.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }));

  // ---- Motes of light drifting up the page ---------------------------------------------------

  (function motes() {
    const canvas = $('#motes');
    if (reduceMotion || !canvas.getContext) { canvas.remove(); return; }
    const ctx = canvas.getContext('2d');

    // One soft glowing dot, drawn once and stamped everywhere.
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 64;
    const s = sprite.getContext('2d');
    const glow = s.createRadialGradient(32, 32, 0, 32, 32, 32);
    glow.addColorStop(0, 'rgba(255,250,230,1)');
    glow.addColorStop(0.25, 'rgba(255,222,150,.75)');
    glow.addColorStop(1, 'rgba(255,214,140,0)');
    s.fillStyle = glow;
    s.fillRect(0, 0, 64, 64);

    let width = 0, height = 0, list = [], raf = 0, last = performance.now();
    const spawn = anywhere => ({
      x: Math.random() * width,
      y: anywhere ? Math.random() * height : height + 20,
      size: 6 + Math.random() * 14,
      speed: 8 + Math.random() * 18,
      sway: Math.random() * Math.PI * 2,
      twinkle: Math.random() * Math.PI * 2,
      alpha: 0.25 + Math.random() * 0.5,
    });

    function resize() {
      const dpr = Math.min(2, devicePixelRatio || 1);
      width = innerWidth;
      height = innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(70, Math.round(width * height / 24000));
      while (list.length < count) list.push(spawn(true));
      list.length = count;
    }

    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, width, height);
      for (const m of list) {
        m.y -= m.speed * dt;
        m.sway += dt * 0.7;
        m.twinkle += dt * 2.2;
        if (m.y < -30) Object.assign(m, spawn(false));
        ctx.globalAlpha = m.alpha * (0.55 + 0.45 * Math.sin(m.twinkle));
        ctx.drawImage(sprite, m.x + Math.sin(m.sway) * 16 - m.size / 2, m.y - m.size / 2, m.size, m.size);
      }
      raf = requestAnimationFrame(frame);
    }

    resize();
    addEventListener('resize', resize);
    document.addEventListener('visibilitychange', () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); }
    });
    raf = requestAnimationFrame(frame);
  })();
})();
