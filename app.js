document.addEventListener('DOMContentLoaded', () => {
  const home = document.getElementById('home');
  const game = document.getElementById('game');
  const enterBtn = document.getElementById('enterBtn');
  const backBtn = document.getElementById('backBtn');
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

  let gameData = null;
  let preloadedImages = {};
  let bufferCanvas = null;
  let bufferCtx = null;
  let ctx = wheel.getContext('2d');
  let angle = 0;
  let spinning = false;

  // Audio context
  let audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  function playTone(freq, duration = 0.08, type = 'sine', volume = 0.07) {
    try {
      ensureAudio();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(volume, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration + 0.02);
    } catch (e) {
      console.warn('Audio error', e);
    }
  }

  // Preload images
  async function preloadImages(names) {
    const promises = names.map(name => new Promise(resolve => {
      const img = new Image();
      img.onload = () => { preloadedImages[name] = img; resolve({ name, ok: true }); };
      img.onerror = () => { console.warn('Image failed to load:', name); preloadedImages[name] = null; resolve({ name, ok: false }); };
      img.src = name;
    }));
    return Promise.all(promises);
  }

  // Load game data and preload images
  async function loadGameData() {
    try {
      const res = await fetch('gameData.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      gameData = await res.json();

      const imagesToLoad = new Set();
      if (gameData.coverImage) imagesToLoad.add(gameData.coverImage);
      if (Array.isArray(gameData.initialImages)) gameData.initialImages.forEach(i => imagesToLoad.add(i));
      (gameData.choices || []).forEach(c => { if (c.image) imagesToLoad.add(c.image); });

      await preloadImages(Array.from(imagesToLoad));
    } catch (e) {
      console.warn('Failed to load gameData.json, using fallback', e);
      gameData = {
        choices: [
          { text: 'Repos', image: 'paon3.PNG', emoji: '😴', drinks: { pinte: 0, jagger: 0, whisky: 0 } },
          { text: 'Fête', image: 'paon6.PNG', emoji: '🎉', drinks: { pinte: 20, jagger: 12, whisky: 12 } }
        ]
      };
      await preloadImages(['paon3.PNG', 'paon6.PNG']);
    }
  }

  // Resize canvas and buffer for DPI
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = wheel.getBoundingClientRect();
    const width = Math.max(200, Math.round(rect.width));
    const height = Math.max(200, Math.round(rect.height));

    wheel.width = width * dpr;
    wheel.height = height * dpr;
    wheel.style.width = width + 'px';
    wheel.style.height = height + 'px';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Buffer canvas for static wheel
    bufferCanvas = document.createElement('canvas');
    bufferCanvas.width = wheel.width;
    bufferCanvas.height = wheel.height;
    bufferCanvas.style.width = wheel.style.width;
    bufferCanvas.style.height = wheel.style.height;
    bufferCtx = bufferCanvas.getContext('2d');
    bufferCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    drawStaticWheel();
    renderWheel();
  }

  // Draw static wheel on buffer canvas
  function drawStaticWheel() {
    if (!bufferCtx || !gameData) return;
    const choices = gameData.choices || [];
    const n = choices.length;
    const dpr = window.devicePixelRatio || 1;
    const W = bufferCanvas.width / dpr;
    const H = bufferCanvas.height / dpr;
    const cx = W / 2;
    const cy = H / 2;
    const r = Math.min(cx, cy) - 8;
    const sectorAngle = (2 * Math.PI) / n;

    bufferCtx.clearRect(0, 0, bufferCanvas.width, bufferCanvas.height);

    for (let i = 0; i < n; i++) {
      const startAngle = i * sectorAngle - Math.PI / 2;
      const endAngle = startAngle + sectorAngle;

      // Sector background
      bufferCtx.beginPath();
      bufferCtx.moveTo(cx, cy);
      bufferCtx.arc(cx, cy, r, startAngle, endAngle);
      bufferCtx.closePath();
      bufferCtx.fillStyle = i % 2 === 0 ? '#2b1c5e' : '#3b2a78';
      bufferCtx.fill();
      bufferCtx.strokeStyle = 'rgba(255,255,255,0.03)';
      bufferCtx.stroke();

      // Emoji
      const midAngle = startAngle + sectorAngle / 2;
      bufferCtx.save();
      bufferCtx.translate(cx, cy);
      bufferCtx.rotate(midAngle);
      bufferCtx.font = `${Math.round(r * 0.14)}px serif`;
      bufferCtx.textAlign = 'center';
      bufferCtx.textBaseline = 'middle';
      bufferCtx.fillStyle = '#fff6ff';
      bufferCtx.fillText(choices[i].emoji || '❓', r * 0.6, 0);
      bufferCtx.restore();
    }

    // Center circle
    bufferCtx.beginPath();
    bufferCtx.arc(cx, cy, Math.min(56, r * 0.22), 0, 2 * Math.PI);
    bufferCtx.fillStyle = '#0b0713';
    bufferCtx.fill();
    bufferCtx.fillStyle = '#9db7ff';
    bufferCtx.font = '700 12px Arial';
    bufferCtx.textAlign = 'center';
    bufferCtx.fillText('Le destin de Didier', cx, cy + 4);
  }

  // Render rotated wheel from buffer
  function renderWheel() {
    if (!bufferCanvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = wheel.width / dpr;
    const H = wheel.height / dpr;

    ctx.clearRect(0, 0, wheel.width, wheel.height);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(angle);
    ctx.translate(-W / 2, -H / 2);
    ctx.drawImage(bufferCanvas, 0, 0, wheel.width, wheel.height);
    ctx.restore();
  }

  // Spin animation
  function startSpin() {
    if (spinning || !gameData || !gameData.choices) return;
    ensureAudio();
    spinning = true;
    spinBtn.disabled = true;

    const n = gameData.choices.length;
    const sectorAngle = (2 * Math.PI) / n;
    const targetIndex = Math.floor(Math.random() * n);
    const rotations = 8 + Math.floor(Math.random() * 6);
    const offset = (Math.random() - 0.5) * sectorAngle * 0.9;
    const finalAngle = rotations * 2 * Math.PI + targetIndex * sectorAngle + sectorAngle / 2 + offset;

    const duration = 3200 + Math.floor(Math.random() * 900);
    const clicks = Math.max(6, Math.floor(duration / 120));
    for (let i = 0; i < clicks; i++) {
      setTimeout(() => playTone(700 + Math.random() * 600, 0.03, 'triangle', 0.03), i * 110);
    }

    const startTime = performance.now();
    const initialAngle = angle;
    const targetAngle = angle + finalAngle;

    function animate(now) {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      angle = initialAngle + (targetAngle - initialAngle) * ease;
      renderWheel();
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        spinning = false;
        spinBtn.disabled = false;
        const normalizedAngle = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const idx = Math.floor(((normalizedAngle + Math.PI / 2) / sectorAngle)) % n;
        const selectedIndex = (n - idx) % n;
        showResult(selectedIndex);
      }
    }
    requestAnimationFrame(animate);
  }

  // Mood text based on drinks total
  function getMood(total) {
    if (total <= 0) return 'Calme';
    if (total <= 20) return 'Éveillé';
    if (total <= 40) return 'Chaud';
    return 'PAON FOU !!!';
  }
  function getMoodPhrase(total) {
    if (total <= 0) return "Didier chill, soirée safe.";
    if (total <= 20) return "Le paon se réchauffe doucement.";
    if (total <= 40) return "Ça part en freestyle, garde un œil.";
    return "PAON FOU : souvenirs non garantis.";
  }

  // Show result overlay
  function showResult(index) {
    const choice = gameData.choices[index];
    if (!choice) {
      console.error('Choice not found for index', index);
      return;
    }

    // Set image src (use preloaded if available)
    const imgName = choice.image || '';
    if (preloadedImages[imgName]) {
      resultImage.src = preloadedImages[imgName].src;
    } else {
      resultImage.src = imgName;
    }
    resultImage.alt = choice.text || 'Image résultat';

    resultText.textContent = choice.text || '';
    resultEmoji.textContent = choice.emoji || '';

    const drinks = choice.drinks || {};
    const p = drinks.pinte ?? drinks.p ?? 0;
    const j = drinks.jagger ?? drinks.j ?? 0;
    const w = drinks.whisky ?? drinks.w ?? 0;

    drinkP.textContent = p;
    drinkJ.textContent = j;
    drinkW.textContent = w;

    const total = p + j + w;
    paonMood.textContent = `${getMood(total)} (${total} verres) — ${getMoodPhrase(total)}`;

    resultPanel.setAttribute('aria-hidden', 'false');
    resultPanel.classList.add('visible');

    playTone(420, 0.18, 'square', 0.12);
    setTimeout(() => playTone(620, 0.12, 'sawtooth', 0.09), 180);

    try {
      resultImage.animate([{ transform: 'scale(0.96)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'ease-out' });
    } catch (e) {}
  }

  // Hide result overlay
  function hideResult() {
    resultPanel.setAttribute('aria-hidden', 'true');
    resultPanel.classList.remove('visible');
  }

  // Event listeners
  enterBtn.addEventListener('click', () => {
    try {
      ensureAudio();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (e) {}
    home.classList.add('hidden');
    game.classList.remove('hidden');
    enterBtn.style.display = 'none';
    setTimeout(() => resizeCanvas(), 80);
    playTone(480, 0.12, 'sine', 0.08);
  });

  backBtn.addEventListener('click', () => location.reload());

  spinBtn.addEventListener('click', () => {
    if (!gameData) return;
    startSpin();
  });

  closeResult.addEventListener('click', () => hideResult());

  // Resize canvas on window resize
  window.addEventListener('resize', () => {
    resizeCanvas();
    drawStaticWheel();
    renderWheel();
  });

  // Initialize
  async function init() {
    await loadGameData();
    resizeCanvas();
    drawStaticWheel();
    renderWheel();
  }

  init();
});
