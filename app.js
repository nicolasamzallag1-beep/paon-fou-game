// app.js - version avec musique de fond "loufoque" et sons de transition
document.addEventListener('DOMContentLoaded', () => {
  // ---------------- Audio / WebAudio setup ----------------
  let audioCtx = null;
  let bgIntervalId = null;
  let bgGainNode = null;
  let bgPlaying = false;
  let isMuted = false;

  function ensureAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function smallEnvelopeGain(duration = 0.12, peak = 0.06) {
    const ctx = ensureAudio();
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(peak, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    return g;
  }

  function playTone(freq = 440, type = 'sine', duration = 0.12, vol = 0.06) {
    const ctx = ensureAudio();
    const o = ctx.createOscillator();
    const g = smallEnvelopeGain(duration, vol);
    o.type = type;
    o.frequency.value = freq;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + duration + 0.02);
  }

  // richer spin sound (short sequence)
  function playSpinSound() {
    const ctx = ensureAudio();
    const now = ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const freq = 320 + i * 30 + (Math.random() * 8);
      o.type = 'sawtooth';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.05, now + i * 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.04 + 0.08);
      o.connect(g); g.connect(ctx.destination);
      o.start(now + i * 0.04);
      o.stop(now + i * 0.04 + 0.09);
    }
  }

  // result flourish
  function playResultSound() {
    const ctx = ensureAudio();
    const now = ctx.currentTime;
    const freqs = [780, 620, 920];
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = i === 2 ? 'triangle' : 'sine';
      o.frequency.value = f + (Math.random() * 6 - 3);
      g.gain.setValueAtTime(0.08 - i * 0.02, now + i * 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 0.16);
      o.connect(g); g.connect(ctx.destination);
      o.start(now + i * 0.06);
      o.stop(now + i * 0.06 + 0.18);
    });
  }

  // background "loufoque" melody
  const bgMelody = [
    { f: 440, d: 220 }, // A4
    { f: 523.25, d: 160 }, // C5
    { f: 392, d: 220 }, // G4
    { f: 659.25, d: 160 } // E5
  ];
  function startBackgroundMusic() {
    if (bgPlaying) return;
    const ctx = ensureAudio();
    bgGainNode = ctx.createGain();
    bgGainNode.gain.value = isMuted ? 0 : 0.04;
    bgGainNode.connect(ctx.destination);
    let idx = 0;
    // play one note at a time with a bit of stereo-ish detune by duplicating slightly detuned oscillator
    bgIntervalId = setInterval(() => {
      const note = bgMelody[idx % bgMelody.length];
      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.linearRampToValueAtTime(1.0, ctx.currentTime + 0.02);
      g.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + note.d / 1000);
      o1.type = 'triangle'; o1.frequency.value = note.f * (1 + (Math.random() * 0.006 - 0.003));
      o2.type = 'sine'; o2.frequency.value = note.f * (1 + (Math.random() * 0.01 - 0.005));
      o1.connect(g); o2.connect(g);
      g.connect(bgGainNode);
      o1.start();
      o2.start();
      o1.stop(ctx.currentTime + note.d / 1000 + 0.02);
      o2.stop(ctx.currentTime + note.d / 1000 + 0.02);
      idx++;
    }, 260); // short, bouncy loop
    bgPlaying = true;
  }

  function stopBackgroundMusic() {
    if (!bgPlaying) return;
    if (bgIntervalId) clearInterval(bgIntervalId);
    bgIntervalId = null;
    if (bgGainNode) { bgGainNode.disconnect(); bgGainNode = null; }
    bgPlaying = false;
  }

  function setMuted(m) {
    isMuted = m;
    if (bgGainNode) bgGainNode.gain.value = m ? 0 : 0.04;
    // quick click feedback even if muted: very low volume sound (or nothing)
    if (!m) playTone(480, 'sine', 0.08, 0.03);
  }

  // create a small floating mute toggle into DOM
  function injectMuteButton() {
    const btn = document.createElement('button');
    btn.id = 'soundToggle';
    btn.title = 'Activer / couper le son';
    btn.innerText = '🔊';
    Object.assign(btn.style, {
      position: 'fixed',
      right: '14px',
      top: '14px',
      zIndex: 2000,
      background: 'linear-gradient(180deg,#a07aff,#8b4fff)',
      color: '#fff',
      border: 'none',
      padding: '8px 10px',
      borderRadius: '20px',
      boxShadow: '0 6px 18px rgba(0,0,0,0.4)',
      cursor: 'pointer',
      fontWeight: 800,
      fontSize: '14px'
    });
    btn.addEventListener('click', () => {
      setMuted(!isMuted);
      btn.innerText = isMuted ? '🔇' : '🔊';
    });
    document.body.appendChild(btn);
  }

  // ---------------- DOM & Game (existing) ----------------
  const home = document.getElementById('home');
  const intro = document.getElementById('intro');
  const introImage = document.getElementById('introImage');
  const introTitle = document.getElementById('introTitle');
  const introCard = document.getElementById('introCard');
  const enterBtn = document.getElementById('enterBtn');
  const game = document.getElementById('game');
  const spinBtn = document.getElementById('spinBtn');
  const rulesToggle = document.getElementById('rulesToggle');
  const rulesBox = document.getElementById('rules');

  const wheel = document.getElementById('wheel');
  const ctx = wheel.getContext('2d');

  const resultPanel = document.getElementById('resultPanel');
  const resultImage = document.getElementById('resultImage');
  const resultText = document.getElementById('resultText');
  const resultEmoji = document.getElementById('resultEmoji');
  const drinkP = document.getElementById('drinkP');
  const drinkJ = document.getElementById('drinkJ');
  const drinkW = document.getElementById('drinkW');
  const paonMood = document.getElementById('paonMood');
  const closeResult = document.getElementById('closeResult');

  let gameData = null;
  let spinning = false;
  let currentAngle = 0;

  // animated title letters
  (function animateIntroTitle(){
    const el = introTitle;
    if (!el) return;
    const text = el.textContent.trim();
    el.textContent = '';
    for (let i = 0; i < text.length; i++) {
      const ch = text[i] === ' ' ? '\u00A0' : text[i];
      const span = document.createElement('span');
      span.textContent = ch;
      span.style.animationDelay = `${i * 36}ms`;
      el.appendChild(span);
    }
  })();

  // load data
  async function loadData() {
    try {
      const res = await fetch('gameData.json');
      gameData = await res.json();
      prepareCanvas();
      drawWheel();
    } catch (e) {
      console.error('Erreur chargement gameData.json', e);
      alert('Impossible de charger gameData.json. Vérifie le fichier et les chemins des images.');
    }
  }

  function prepareCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const size = 340;
    wheel.width = size * dpr;
    wheel.height = size * dpr;
    wheel.style.width = size + 'px';
    wheel.style.height = size + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawWheel() {
    if (!gameData) return;
    const choices = gameData.choices;
    const n = choices.length;
    const arc = (2 * Math.PI) / n;
    const radius = 160;
    ctx.clearRect(0, 0, wheel.width, wheel.height);
    for (let i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.fillStyle = i % 2 === 0 ? '#3a1a6a' : '#2a154f';
      ctx.moveTo(radius, radius);
      ctx.arc(radius, radius, radius - 8, i * arc, (i + 1) * arc);
      ctx.fill();

      ctx.save();
      ctx.translate(radius, radius);
      ctx.rotate(i * arc + arc / 2);
      ctx.fillStyle = '#d6a2e8';
      ctx.font = '28px serif';
      ctx.textAlign = 'center';
      ctx.fillText(choices[i].emoji || '🍸', radius - 48, 10);
      ctx.restore();
    }
    // centre badge
    ctx.beginPath(); ctx.arc(radius, radius, 36, 0, 2 * Math.PI); ctx.fillStyle = '#12092a'; ctx.fill();
    ctx.fillStyle = '#a07aff'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.fillText('DESTIN', radius, radius + 4);
  }

  // spin logic (keeps existing behavior)
  function spinWheel() {
    if (spinning || !gameData) return;
    spinning = true;
    spinBtn.disabled = true;
    playSpinSound();

    const n = gameData.choices.length;
    const arc = (2 * Math.PI) / n;
    const targetIndex = Math.floor(Math.random() * n);
    const spins = 8 + Math.floor(Math.random() * 3);
    const targetAngle = spins * 2 * Math.PI + (Math.PI * 1.5) - (targetIndex * arc) - (arc / 2);
    const duration = 2800;
    const start = performance.now();

    function animate(now) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      currentAngle = targetAngle * ease;
      wheel.style.transform = `rotate(${currentAngle}rad)`;
      if (t < 1) requestAnimationFrame(animate);
      else {
        spinning = false;
        spinBtn.disabled = false;
        playResultSound();
        showResult(targetIndex);
      }
    }
    requestAnimationFrame(animate);
  }

  function getMood(total) {
    if (total === 0) return "Didier est sobre, soirée tranquille.";
    if (total < 4) return "Le paon s'échauffe doucement.";
    if (total < 8) return "Didier commence à s'amuser.";
    if (total < 12) return "Paon fou en action, ça bouge !";
    return "PAON FOU MAXIMUM ! Soirée légendaire.";
  }

  function showResult(idx) {
    const c = gameData.choices[idx];
    resultImage.src = c.image;
    resultText.textContent = c.text;
    resultEmoji.textContent = c.emoji || '';
    drinkP.textContent = (c.drinks && c.drinks.p) ? c.drinks.p : 0;
    drinkJ.textContent = (c.drinks && c.drinks.j) ? c.drinks.j : 0;
    drinkW.textContent = (c.drinks && c.drinks.w) ? c.drinks.w : 0;
    const total = (Number(drinkP.textContent) || 0) + (Number(drinkJ.textContent) || 0) + (Number(drinkW.textContent) || 0);
    paonMood.textContent = c.mood ? c.mood : getMood(total);
    resultPanel.classList.add('show');
    resultPanel.setAttribute('aria-hidden', 'false');
  }

  // ---------------- Events & Flow ----------------

  // Inject mute button
  injectMuteButton();

  // Enter -> intro (start ambient music here)
  enterBtn.addEventListener('click', () => {
    ensureAudio();
    // start light background loop (loufoque)
    startBackgroundMusic();
    home.classList.add('hidden');
    intro.classList.remove('hidden');

    // playful stinger
    playTone(520, 'triangle', 0.12, 0.06);
    playTone(720, 'sine', 0.08, 0.04);

    // alternance images
    let toggle = true;
    introImage.src = 'paon9.PNG';
    const id = setInterval(() => {
      introImage.src = toggle ? 'paon10.PNG' : 'paon9.PNG';
      toggle = !toggle;
    }, 1800);

    // clic sur carte lance le jeu (transition sound)
    introCard.onclick = () => {
      clearInterval(id);
      // small flourish
      playTone(660, 'sine', 0.12, 0.05);
      playTone(540, 'sine', 0.09, 0.04);
      intro.classList.add('hidden');
      game.classList.remove('hidden');
      loadData();
    };
  });

  // rules toggle (text to the right)
  if (rulesToggle) rulesToggle.addEventListener('click', () => {
    rulesBox.classList.toggle('hidden');
    const hidden = rulesBox.classList.contains('hidden');
    rulesBox.setAttribute('aria-hidden', hidden ? 'true' : 'false');
    // tiny click sound
    playTone(hidden ? 380 : 600, 'square', 0.06, 0.03);
  });

  // spin button
  spinBtn.addEventListener('click', spinWheel);

  // close result
  closeResult.addEventListener('click', () => {
    resultPanel.classList.remove('show');
    resultPanel.setAttribute('aria-hidden', 'true');
    // gentle click
    playTone(420, 'sine', 0.06, 0.03);
  });

  // responsive redraw
  window.addEventListener('resize', () => {
    if (gameData) { prepareCanvas(); drawWheel(); }
  });

  // initial overlay hidden
  if (resultPanel) {
    resultPanel.classList.remove('show');
    resultPanel.setAttribute('aria-hidden', 'true');
  }

  // safety: stop music when page hidden to save CPU
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopBackgroundMusic();
    else if (!bgPlaying && audioCtx && audioCtx.state !== 'suspended') startBackgroundMusic();
  });

  // expose some helpers for debug (optional)
  window.__paonAudio = {
    startBackgroundMusic,
    stopBackgroundMusic,
    setMuted
  };
});
