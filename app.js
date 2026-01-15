// app.js - roue DPI-aware, images préchargées, sons via WebAudio, résultat + overlay
document.addEventListener('DOMContentLoaded', () => {
  // UI refs
  const home = document.getElementById('home');
  const game = document.getElementById('game');
  const enterBtn = document.getElementById('enterBtn');
  const backBtn = document.getElementById('backBtn');
  const promptImg = document.getElementById('promptImg');
  const wheel = document.getElementById('wheel');
  const spinBtn = document.getElementById('spinBtn');
  const resultPanel = document.getElementById('resultPanel');
  const resultImage = document.getElementById('resultImage');
  const resultText = document.getElementById('resultText');
  const resultEmoji = document.getElementById('resultEmoji');
  const drinkP = document.getElementById('drinkP');
  const drinkJ = document.getElementById('drinkJ');
  const drinkW = document.getElementById('drinkW');
  const paonMood = document.getElementById('paonMood');
  const closeResult = document.getElementById('closeResult');

  // state
  let gameData = null;
  const preloaded = {}; // name -> Image or null
  let buffer = null, bctx = null;
  const ctx = wheel.getContext('2d');
  let angle = 0;           // current rotation (radians)
  let spinning = false;

  // Audio
  let audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  function playTone(freq, dur = 0.08, type = 'sine', vol = 0.07) {
    try {
      ensureAudio();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.value = vol;
      o.connect(g); g.connect(audioCtx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
      o.stop(audioCtx.currentTime + dur + 0.02);
    } catch (e) { console.warn('audio err', e); }
  }
  function playClink() {
    // quick "glasses clink" effect: 3 short tones
    playTone(900, 0.05, 'triangle', 0.04);
    setTimeout(()=> playTone(1100, 0.05, 'triangle', 0.035), 80);
    setTimeout(()=> playTone(1300, 0.06, 'triangle', 0.03), 170);
  }

  // Utilities
  const TAU = Math.PI * 2;
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}

  // Load JSON + preload images
  async function loadGame() {
    try {
      const res = await fetch('gameData.json', {cache: 'no-cache'});
      if (!res.ok) throw new Error('HTTP ' + res.status);
      gameData = await res.json();
    } catch (e) {
      console.warn('Impossible de charger gameData.json:', e);
      // minimal fallback
      gameData = { choices: [] };
    }

    // gather image names
    const imgs = new Set();
    if (gameData.coverImage) imgs.add(gameData.coverImage);
    if (Array.isArray(gameData.initialImages)) gameData.initialImages.forEach(i=>imgs.add(i));
    (gameData.choices || []).forEach(c => { if (c.image) imgs.add(c.image); });

    // preload
    await Promise.all(Array.from(imgs).map(name => new Promise(resolve => {
      const img = new Image();
      img.onload = () => { preloaded[name] = img; resolve(); };
      img.onerror = () => { console.warn('Échec image:', name); preloaded[name] = null; resolve(); };
      img.src = name;
    })));

    // set initial alternating prompt image (toggle each entry)
    const initialImgs = Array.isArray(gameData.initialImages) && gameData.initialImages.length ? gameData.initialImages : ['paon9.PNG','paon10.PNG'];
    // alternate every 700ms while on home (small animation)
    let i = 0;
    setInterval(() => {
      if (home.classList.contains('active')) {
        const name = initialImgs[i % initialImgs.length];
        promptImg.src = preloaded[name] ? preloaded[name].src : name;
        i++;
      }
    }, 700);
  }

  // Canvas DPI aware + buffer
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = wheel.getBoundingClientRect();
    const wCss = Math.max(200, Math.round(rect.width));
    const hCss = Math.max(200, Math.round(rect.height));
    wheel.style.width = wCss + 'px';
    wheel.style.height = hCss + 'px';
    wheel.width = Math.round(wCss * dpr);
    wheel.height = Math.round(hCss * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // buffer
    buffer = document.createElement('canvas');
    buffer.width = wheel.width;
    buffer.height = wheel.height;
    buffer.style.width = wheel.style.width;
    buffer.style.height = wheel.style.height;
    bctx = buffer.getContext('2d');
    bctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    drawStaticWheel();
    render();
  }

  // draw wheel sectors to buffer
  function drawStaticWheel() {
    if (!bctx) return;
    const choices = gameData.choices || [];
    const n = Math.max(1, choices.length);
    const W = buffer.width / (window.devicePixelRatio || 1);
    const H = buffer.height / (window.devicePixelRatio || 1);
    const cx = W / 2, cy = H / 2, r = Math.min(cx, cy) - 8;
    const sector = TAU / n;

    bctx.clearRect(0,0,buffer.width,buffer.height);

    for (let i=0;i<n;i++){
      const start = i * sector - Math.PI/2;
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
      const mid = start + sector/2;
      bctx.save();
      bctx.translate(cx, cy);
      bctx.rotate(mid);
      const fontSize = Math.max(16, Math.round(r * 0.14));
      bctx.font = `${fontSize}px serif`;
      bctx.textAlign = 'center';
      bctx.textBaseline = 'middle';
      bctx.fillStyle = '#fff6ff';
      const emoji = choices[i] && choices[i].emoji ? choices[i].emoji : '❓';
      bctx.fillText(emoji, r * 0.6, 0);
      bctx.restore();
    }

    // center
    bctx.beginPath();
    bctx.arc(cx, cy, Math.min(56, r*0.22), 0, TAU);
    bctx.fillStyle = '#0b0713';
    bctx.fill();
    bctx.fillStyle = '#9db7ff';
    bctx.font = '700 12px Arial';
    bctx.textAlign = 'center';
    bctx.fillText('Le destin de Didier', cx, cy + 4);
  }

  // draw rotated buffer onto main canvas
  function render() {
    if (!buffer || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const W = wheel.width / dpr;
    const H = wheel.height / dpr;
    ctx.clearRect(0,0,wheel.width,wheel.height);
    ctx.save();
    ctx.translate(W/2, H/2);
    ctx.rotate(angle);
    ctx.translate(-W/2, -H/2);
    ctx.drawImage(buffer, 0, 0, wheel.width, wheel.height);
    ctx.restore();
  }

  // spin logic: choose a target index and compute final rotation to land on its center
  function spin() {
    if (spinning || !gameData || !gameData.choices || !gameData.choices.length) return;
    spinning = true;
    spinBtn.disabled = true;
    ensureAudio();

    const n = gameData.choices.length;
    const sector = TAU / n;
    const targetIndex = Math.floor(Math.random() * n);

    // compute final rotation so that the selected sector center aligns with pointer at top
    const current = ((angle % TAU) + TAU) % TAU; // current in [0,TAU)
    const desiredCenter = targetIndex * sector + sector/2; // center angle in wheel coordinates
    // we want angle_final % TAU == desiredCenter  => add rotations + (desiredCenter - current normalized)
    const rotations = 6 + Math.floor(Math.random() * 5);
    let diff = (desiredCenter - current) % TAU;
    if (diff < 0) diff += TAU;
    const finalDelta = rotations * TAU + diff;

    const start = performance.now();
    const duration = 3100 + Math.floor(Math.random() * 900);
    // click sounds during spin
    const clicks = Math.max(6, Math.floor(duration / 120));
    for (let i=0;i<clicks;i++){
      setTimeout(()=> playTone(700 + Math.random()*500, 0.03, 'triangle', 0.03), i * 110);
    }

    const initial = angle;
    function frame(now){
      const t = Math.min(1, (now - start)/duration);
      const ease = 1 - Math.pow(1 - t, 3); // ease out cubic
      angle = initial + finalDelta * ease;
      render();
      if (t < 1) requestAnimationFrame(frame);
      else {
        spinning = false;
        spinBtn.disabled = false;
        // selected is targetIndex (by construction)
        showResult(targetIndex);
      }
    }
    requestAnimationFrame(frame);
  }

  // compute mood text
  function moodText(total){
    if (total <= 0) return {level:'Calme', phrase:'Didier chill, soirée safe.'};
    if (total <= 20) return {level:'Éveillé', phrase:'Le paon se réchauffe doucement.'};
    if (total <= 40) return {level:'Chaud', phrase:'Ça part en freestyle, garde un œil.'};
    return {level:'PAON FOU !!!', phrase:'PAON FOU : souvenirs non garantis.'};
  }

  // show result overlay for given choice index
  function showResult(index) {
    const choice = gameData.choices[index];
    if (!choice) { console.error('choice missing', index); return; }

    // set image - prefer preloaded
    const imgName = choice.image || '';
    resultImage.src = preloaded[imgName] ? preloaded[imgName].src : (imgName || '');
    resultImage.alt = choice.text || 'Résultat';

    resultText.textContent = choice.text || '';
    resultEmoji.textContent = choice.emoji || '';

    // drinks keys tolerant (pinte/jagger/whisky) or short keys p/j/w
    const d = choice.drinks || {};
    const p = d.pinte ?? d.p ?? 0;
    const j = d.jagger ?? d.j ?? 0;
    const w = d.whisky ?? d.w ?? 0;

    drinkP.textContent = p;
    drinkJ.textContent = j;
    drinkW.textContent = w;

    const total = p + j + w;
    const mood = moodText(total);
    paonMood.textContent = `${mood.level} — ${mood.phrase} (${total} verres)`;

    // show overlay
    resultPanel.setAttribute('aria-hidden', 'false');

    // sound + small animation
    playTone(420, 0.18, 'square', 0.12);
    setTimeout(()=> playTone(640, 0.12, 'sawtooth', 0.09), 160);
    setTimeout(()=> playClink(), 260);

    try {
      resultImage.animate([{ transform: 'scale(0.96)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'ease-out' });
    } catch (e){}
  }

  function hideResult() {
    resultPanel.setAttribute('aria-hidden', 'true');
  }

  // UI wiring
  enterBtn.addEventListener('click', () => {
    // unlock audio if needed
    try { ensureAudio(); if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); } catch(e){}
    // hide home, show game, remove Enter button so it cannot be clicked later
    home.classList.add('hidden');
    game.classList.remove('hidden');
    enterBtn.style.display = 'none';
    // ensure canvas sized after layout change
    setTimeout(()=>{ resizeCanvas(); }, 60);
    playTone(480, 0.12, 'sine', 0.08);
  });

  backBtn.addEventListener('click', ()=> {
    // simple reload to reset
    location.reload();
  });

  spinBtn.addEventListener('click', ()=> spin());
  closeResult.addEventListener('click', ()=> hideResult());

  // initial boot
  (async function boot(){
    await loadGame();
    // set default prompt image (first initial image or paon9)
    const initials = (gameData.initialImages && gameData.initialImages.length) ? gameData.initialImages : ['paon9.PNG','paon10.PNG'];
    const first = initials[0];
    promptImg.src = preloaded[first] ? preloaded[first].src : first;

    // resize canvas to element size
    // set explicit CSS size so getBoundingClientRect works
    wheel.style.width = wheel.style.width || '360px';
    wheel.style.height = wheel.style.height || '360px';
    resizeCanvas();
    drawStaticWheel();
    render();
  })();

  // window resize: debounce
  let rtid = null;
  window.addEventListener('resize', ()=> {
    clearTimeout(rtid);
    rtid = setTimeout(()=> { resizeCanvas(); drawStaticWheel(); render(); }, 80);
  });
});
