document.addEventListener('DOMContentLoaded', () => {
  const home = document.getElementById('home');
  const game = document.getElementById('game');
  const enterBtn = document.getElementById('enterBtn');
  const backBtn = document.getElementById('backBtn');
  const wheelCanvas = document.getElementById('wheel');
  const spinBtn = document.getElementById('spinBtn');
  const resultPanel = document.getElementById('resultPanel');
  const resultImage = document.getElementById('resultImage');
  const resultText = document.getElementById('resultText');
  const resultEmoji = document.getElementById('resultEmoji');
  const drinkP = document.querySelector('#resultPanel #drinkP');
  const drinkJ = document.querySelector('#resultPanel #drinkJ');
  const drinkW = document.querySelector('#resultPanel #drinkW');
  const paonMood = document.getElementById('paonMood');
  const closeResult = document.getElementById('closeResult');

  let gameData = null;
  let wheelAngle = 0;
  let isSpinning = false;

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  function playTone(freq, type = 'sine', dur = 0.08, vol = 0.08) {
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(vol, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + dur);
    } catch (e) {
      console.warn('Audio error', e);
    }
  }

  function playClick() {
    playTone(820 + Math.random() * 360, 'triangle', 0.05, 0.05);
  }

  function playResult() {
    playTone(420, 'square', 0.18, 0.12);
    setTimeout(() => playTone(620, 'sawtooth', 0.16, 0.09), 220);
  }

  enterBtn.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    home.classList.add('hidden');
    game.classList.remove('hidden');
    setTimeout(() => spinBtn.focus(), 120);
    playTone(460, 'sine', 0.12, 0.08);
  });

  backBtn.addEventListener('click', () => {
    location.reload();
  });

  spinBtn.addEventListener('click', () => {
    if (!gameData || !gameData.choices || gameData.choices.length === 0) {
      console.warn('gameData not ready yet');
      spinBtn.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-6px)' }, { transform: 'translateY(0)' }], { duration: 300 });
      return;
    }
    startSpin();
  });

  closeResult.addEventListener('click', () => {
    resultPanel.classList.add('hidden');
  });

  async function fetchGameData() {
    try {
      const res = await fetch('gameData.json');
      if (!res.ok) throw new Error('status ' + res.status);
      return await res.json();
    } catch (e) {
      console.warn('Impossible de charger gameData.json:', e);
      return null;
    }
  }

  const ctx = wheelCanvas.getContext('2d');

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = wheelCanvas.getBoundingClientRect();
    wheelCanvas.width = Math.max(200, Math.floor(rect.width * dpr));
    wheelCanvas.height = Math.max(200, Math.floor(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (gameData && gameData.choices) drawWheel();
  }

  window.addEventListener('resize', resizeCanvas);

  function drawWheel() {
    const choices = gameData.choices || [];
    const n = Math.max(1, choices.length);
    const cw = wheelCanvas.width;
    const ch = wheelCanvas.height;
    const cx = cw / (window.devicePixelRatio || 1) / 2;
    const cy = ch / (window.devicePixelRatio || 1) / 2;
    const r = Math.min(cx, cy) - 8;
    const sector = (Math.PI * 2) / n;

    ctx.clearRect(0, 0, cw, ch);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx + 4, cy + 6, r + 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fill();
    ctx.restore();

    for (let i = 0; i < n; i++) {
      const start = i * sector - Math.PI / 2;
      const end = start + sector;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = i % 2 === 0 ? '#2b1c5e' : '#3b2a78';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.stroke();

      const mid = start + sector / 2;
      const emoji = choices[i].emoji || '❓';
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(mid);
      ctx.font = `${Math.round(r * 0.18)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#f6f0ff';
      ctx.fillText(emoji, r * 0.6, 0);
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, 48, 0, Math.PI * 2);
    ctx.fillStyle = '#0b0713';
    ctx.fill();
    ctx.fillStyle = '#9db7ff';
    ctx.font = '700 12px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Le destin de Didier', cx, cy + 4);
  }

  function renderRotation(angle) {
    const dpr = window.devicePixelRatio || 1;
    const w = wheelCanvas.width / dpr,
      h = wheelCanvas.height / dpr;
    ctx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(angle);
    ctx.translate(-w / 2, -h / 2);
    drawWheel();
    ctx.restore();
  }

  function startSpin() {
    if (isSpinning) return;
    if (!gameData || !gameData.choices || gameData.choices.length === 0) return;
    isSpinning = true;
    const n = gameData.choices.length;
    const sector = (Math.PI * 2) / n;
    const targetIndex = Math.floor(Math.random() * n);
    const rotations = 9 + Math.floor(Math.random() * 6);
    const offset = Math.random() * sector * 0.8 - sector * 0.4;
    const final = rotations * Math.PI * 2 + targetIndex * sector + sector / 2 + offset;

    const start = performance.now();
    const duration = 3200 + Math.floor(Math.random() * 900);
    const initial = wheelAngle;
    const target = wheelAngle + final;
    playSpinSound(duration);

    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      wheelAngle = initial + (target - initial) * ease;
      renderRotation(wheelAngle);
      if (t < 1) requestAnimationFrame(frame);
      else {
        isSpinning = false;
        const normalized = (wheelAngle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const idx = Math.floor(((normalized + Math.PI / 2) / sector)) % n;
        const selected = (n - idx) % n;
        revealResult(selected);
      }
    }
    requestAnimationFrame(frame);
  }

  function playSpinSound(duration) {
    const count = Math.max(6, Math.floor(duration / 140));
    for (let i = 0; i < count; i++) {
      setTimeout(() => playClick(), i * 130);
    }
  }

  function revealResult(index) {
    const choice = (gameData.choices && gameData.choices[index]) || null;
    if (!choice) {
      console.error('Choice not found', index);
      return;
    }
    playResult();

    const total = (choice.drinks?.pinte || 0) + (choice.drinks?.jagger || 0) + (choice.drinks?.whisky || 0);

    resultImage.src = choice.image || '';
    resultImage.alt = choice.text || '';
    resultText.textContent = choice.text || '';
    resultEmoji.textContent = choice.emoji || '';

    drinkP.textContent = choice.drinks?.pinte || 0;
    drinkJ.textContent = choice.drinks?.jagger || 0;
    drinkW.textContent = choice.drinks?.whisky || 0;

    paonMood.textContent = `Mood: ${paonLevelText(total)} (${total} verres bus)`;

    resultPanel.classList.remove('hidden');
    try {
      resultImage.animate(
        [
          { transform: 'scale(0.92)', filter: 'drop-shadow(0 0 0 #a07aff)' },
          { transform: 'scale(1)', filter: 'drop-shadow(0 0 22px #a07aff)' }
        ],
        { duration: 520, easing: 'ease-out' }
      );
    } catch (e) {}
  }

  function paonLevelText(total) {
    if (total <= 0) return 'Calme';
    if (total <= 12) return 'Éveillé';
    if (total <= 24) return 'Chaud';
    return 'PAON FOU !!!';
  }

  fetchGameData().then((d) => {
    gameData = d || {
      title: 'Ara Ara, Excusez Moi !',
      initialPrompt: 'Que fait le paon fou ce soir ?',
      initialImages: ['paon9.PNG', 'paon10.PNG'],
      choices: []
    };
    resizeCanvas();
    setTimeout(() => renderRotation(wheelAngle), 80);
  });

  function fetchGameData() {
    return fetch('gameData.json')
      .then((res) => {
        if (!res.ok) throw new Error('status ' + res.status);
        return res.json();
      })
      .catch((e) => {
        console.warn('Impossible de charger gameData.json:', e);
        return null;
      });
  }
});
