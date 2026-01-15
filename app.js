// app.js - complet, robuste, DPI-aware, WebAudio (sans MP3), phrases aléatoires
(() => {
  // DOM refs
  const home = document.getElementById('home');
  const game = document.getElementById('game');
  const enterBtn = document.getElementById('enterBtn');
  const backBtn = document.getElementById('backBtn');
  const wheel = document.getElementById('wheel');
  const spinBtn = document.getElementById('spinBtn');
  const resultPanel = document.getElementById('resultPanel');
  const resultImg = document.getElementById('resultImg');
  const resultTitle = document.getElementById('resultTitle');
  const resultEmoji = document.getElementById('resultEmoji');
  const dP = document.getElementById('dP');
  const dJ = document.getElementById('dJ');
  const dW = document.getElementById('dW');
  const moodLabel = document.getElementById('moodLabel');
  const moodPhrase = document.getElementById('moodPhrase');
  const closeResult = document.getElementById('closeResult');

  // state
  let data = null;
  let isSpinning = false;
  let angle = 0;

  // WebAudio context (created on user gesture to avoid autoplay blocks)
  let audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }
  function beep(freq=440, duration=0.12, type='sine', volume=0.08) {
    try {
      ensureAudio();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, audioCtx.currentTime);
      g.gain.setValueAtTime(volume, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(); o.stop(audioCtx.currentTime + duration + 0.02);
    } catch (e) {
      // no-op
      console.warn('Audio failed', e);
    }
  }
  function spinClicks(durationMs) {
    const count = Math.max(6, Math.floor(durationMs / 120));
    for (let i = 0; i < count; i++) {
      setTimeout(() => beep(700 + Math.random() * 700, 0.03, 'triangle', 0.025), i * 120);
    }
  }
  function resultJingle() {
    beep(380, 0.16, 'square', 0.12);
    setTimeout(()=>beep(580,0.12,'sawtooth',0.09), 180);
    setTimeout(()=>beep(820,0.08,'triangle',0.07), 340);
  }

  // Mood phrases table (varie aléatoirement)
  const moods = {
    calm: [
      "Didier chill : soirée pyjama et respect des voisins.",
      "Paon posé : Netflix, couette, et zéro drama."
    ],
    awake: [
      "Didier est en mode léger groove — prudence sur la piste.",
      "Un petit cocktail d'idées folles mais la tête encore claire."
    ],
    hot: [
      "Le paon commence à clamer sa puissance : attention aux histoires.",
      "Ça chauffe : Didier perd un peu la map mais gagne du style."
    ],
    crazy: [
      "PAON FOU : danse sur les tables, stories douteuses et souvenirs flous.",
      "Didier a dépassé le mode humain — conservation non garantie."
    ]
  };
  function randomMoodPhrase(total) {
    let arr;
    if (total <= 0) arr = moods.calm;
    else if (total <= 20) arr = moods.awake;
    else if (total <= 40) arr = moods.hot;
    else arr = moods.crazy;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // canvas and drawing (use offscreen buffer for crisp rotation)
  const ctx = wheel.getContext('2d');
  let buffer = null; // offscreen canvas
  function resizeCanvas() {
    const rect = wheel.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(200, Math.round(rect.width));
    const h = Math.max(200, Math.round(rect.height));
    wheel.width = Math.round(w * dpr);
    wheel.height = Math.round(h * dpr);
    wheel.style.width = w + 'px';
    wheel.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // recreate buffer similarly
    buffer = document.createElement('canvas');
    buffer.width = wheel.width;
    buffer.height = wheel.height;
    buffer.style.width = wheel.style.width;
    buffer.style.height = wheel.style.height;
    drawBaseWheel();
    render();
  }

  function drawBaseWheel() {
    if (!buffer || !data) return;
    const bctx = buffer.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const W = buffer.width / dpr;
    const H = buffer.height / dpr;
    const cx = W / 2;
    const cy = H / 2;
    const r = Math.min(cx, cy) - 8;
    bctx.clearRect(0, 0, buffer.width, buffer.height);

    const choices = data.choices || [];
    const n = Math.max(1, choices.length);
    const sector = (Math.PI * 2) / n;

    // background circle
    bctx.save();
    bctx.translate(0,0);
    for (let i = 0; i < n; i++) {
      const start = i * sector - Math.PI / 2;
      const end = start + sector;
      bctx.beginPath();
      bctx.moveTo(cx, cy);
      bctx.arc(cx, cy, r, start, end);
      bctx.closePath();
      bctx.fillStyle = (i % 2 === 0) ? '#2b1c5e' : '#3b2a78';
      bctx.fill();
      bctx.strokeStyle = 'rgba(255,255,255,0.03)';
      bctx.stroke();

      // emoji
      const mid = start + sector / 2;
      bctx.save();
      bctx.translate(cx, cy);
      bctx.rotate(mid);
      const fontSize = Math.round(r * 0.18);
      bctx.font = `${fontSize}px serif`;
      bctx.textAlign = 'center';
      bctx.textBaseline = 'middle';
      bctx.fillStyle = '#fff6ff';
      const emoji = choices[i].emoji || '❓';
      bctx.fillText(emoji, r * 0.6, 0);
      bctx.restore();
    }
    bctx.restore();

    // center disk
    bctx.beginPath();
    bctx.arc(cx, cy, Math.min(56, r * 0.22), 0, Math.PI * 2);
    bctx.fillStyle = '#0b0713';
    bctx.fill();
    bctx.fillStyle = '#9db7ff';
    bctx.font = '700 12px Arial';
    bctx.textAlign = 'center';
    bctx.fillText('Le destin de Didier', cx, cy + 4);
  }

  function render() {
    if (!buffer) return;
    // clear main
    ctx.clearRect(0, 0, wheel.width, wheel.height);
    // draw rotated buffer onto main canvas
    const dpr = window.devicePixelRatio || 1;
    const W = wheel.width / dpr;
    const H = wheel.height / dpr;
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(angle);
    ctx.translate(-W / 2, -H / 2);
    ctx.drawImage(buffer, 0, 0, wheel.width, wheel.height);
    ctx.restore();
  }

  // spin logic
  function spin() {
    if (isSpinning || !data || !data.choices || data.choices.length === 0) return;
    ensureAudio();
    isSpinning = true;
    spinBtn.disabled = true;

    const n = data.choices.length;
    const sector = (Math.PI * 2) / n;
    const targetIndex = Math.floor(Math.random() * n);
    // add randomness in rotations and offset
    const rotations = 8 + Math.floor(Math.random() * 6);
    const offset = (Math.random() - 0.5) * sector * 0.9;
    const finalAngle = rotations * Math.PI * 2 + targetIndex * sector + sector / 2 + offset;

    const start = performance.now();
    const duration = 3400 + Math.floor(Math.random() * 900);
    const initial = angle;
    const target = angle + finalAngle;

    spinClicks(duration);

    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic
      angle = initial + (target - initial) * ease;
      render();
      if (t < 1) requestAnimationFrame(frame);
      else {
        // compute selected index: convert global angle to index
        const normalized = ((angle % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
        // pointer is at top; sectors start at -pi/2 in our drawing, so compute accordingly
        const idx = Math.floor(((normalized + Math.PI / 2) / sector)) % n;
        const selected = (n - idx) % n;
        // reveal
        setTimeout(() => revealResult(selected), 180);
        isSpinning = false;
        spinBtn.disabled = false;
      }
    }
    requestAnimationFrame(frame);
  }

  // reveal result with animation
  function revealResult(index) {
    const choice = data.choices[index];
    if (!choice) return;
    resultImg.src = choice.image || '';
    resultTitle.textContent = choice.text || '';
    resultEmoji.textContent = choice.emoji || '';
    dP.textContent = choice.p || 0;
    dJ.textContent = choice.j || 0;
    dW.textContent = choice.w || 0;

    const total = (choice.p || 0) + (choice.j || 0) + (choice.w || 0);
    moodLabel.textContent = `Mood: ${paonLevel(total)}`;
    moodPhrase.textContent = randomMoodPhrase(total);

    // animate panel in
    resultPanel.classList.remove('hidden');
    resultPanel.style.opacity = 0;
    resultPanel.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, fill: 'forwards' });
    resultPanel.querySelector('.result-card').animate([{ transform: 'scale(.92)' }, { transform: 'scale(1)' }], { duration: 360, easing: 'cubic-bezier(.2,.9,.2,1)' });

    resultJingle();
  }

  function paonLevel(total) {
    if (total <= 0) return 'Calme';
    if (total <= 20) return 'Éveillé';
    if (total <= 40) return 'Chaud';
    return 'PAON FOU !!!';
  }

  // data load
  async function loadData() {
    try {
      const r = await fetch('gameData.json', {cache: "no-cache"});
      if (!r.ok) throw new Error('HTTP ' + r.status);
      data = await r.json();
      if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
        console.warn('gameData.json vide ou mal formé — vérifier le fichier.');
      }
    } catch (e) {
      console.warn('Impossible de charger gameData.json, fallback minimal', e);
      // minimal fallback so game still works
      data = {
        choices: [
          { id:1, text: 'Repos', image:'paon3.PNG', emoji:'😴', p:0,j:0,w:0 },
          { id:2, text: 'Fête', image:'paon6.PNG', emoji:'🎉', p:18,j:10,w:12 }
        ]
      };
    }
    drawBaseWheel();
    render();
  }

  // helpers & events
  function setupListeners() {
    enterBtn.addEventListener('click', () => {
      // resume audio context on gesture
      try { ensureAudio(); if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); } catch(e){}
      home.classList.add('hidden');
      game.classList.remove('hidden');
      // resize after layout
      setTimeout(()=> { resizeCanvas(); }, 90);
    });
    backBtn.addEventListener('click', () => {
      location.reload();
    });
    spinBtn.addEventListener('click', () => {
      if (!data) return;
      spin();
    });
    closeResult.addEventListener('click', () => {
      // hide panel
      resultPanel.classList.add('hidden');
    });
    // keyboard accessibility (space to spin)
    document.addEventListener('keydown', (e) => {
      if (e.key === ' ' && document.body.contains(game) && !home.classList.contains('active')) {
        e.preventDefault();
        if (!isSpinning) spin();
      }
    });
    window.addEventListener('resize', debounce(resizeCanvas, 120));
  }

  // resize logic
  function resizeCanvas() {
    // set CSS size of wheel to match computed size if not set
    const parent = wheel.parentElement;
    const computed = getComputedStyle(parent);
    // pick the smaller of parent width or viewport to make wheel responsive
    const max = Math.min(parent.clientWidth, window.innerWidth * 0.92, 420);
    wheel.style.width = `${Math.round(max)}px`;
    wheel.style.height = `${Math.round(max)}px`;
    // DPI-aware
    resizeCanvasDPR();
    drawBaseWheel();
    render();
  }
  function resizeCanvasDPR() {
    const rect = wheel.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    wheel.width = Math.round(rect.width * dpr);
    wheel.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // recreate buffer canvas sized like main
    buffer = document.createElement('canvas');
    buffer.width = wheel.width;
    buffer.height = wheel.height;
  }

  // small debounce
  function debounce(fn, wait) {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(()=>fn(...a), wait); };
  }

  // init
  async function init() {
    setupListeners();
    await loadData();
    resizeCanvas();
    // initial render
    drawBaseWheel();
    render();
  }

  // start
  init();
})();
