// app.js - Jeu "Ara Ara, Excusez Moi !" version pro, fun, trash, animations et sons Web Audio

const gameDataUrl = 'gameData.json';

let gameData = null;

const home = document.getElementById('home');
const game = document.getElementById('game');
const enterBtn = document.getElementById('enterBtn');
const restartBtn = document.getElementById('restartBtn');

const promptEl = document.getElementById('prompt');
const startTimeEl = document.getElementById('startTime');
const altA = document.getElementById('altImgA');
const altB = document.getElementById('altImgB');

const wheelCanvas = document.getElementById('wheel');
const ctx = wheelCanvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');
const fastSpinBtn = document.getElementById('fastSpinBtn');

const resultCard = document.getElementById('resultCard');
const resultImage = document.getElementById('resultImage');
const resultText = document.getElementById('resultText');
const resultEmoji = document.getElementById('resultEmoji');
const drinksList = document.getElementById('drinksList');
const paonLevel = document.getElementById('paonLevel');
const nextBtn = document.getElementById('nextBtn');

const moodText = document.getElementById('moodText');

let altInterval = null;
let wheelAngle = 0;
let isSpinning = false;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type, duration, volume = 0.1) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function playClick() {
  playTone(800 + Math.random() * 400, 'triangle', 0.05, 0.05);
}

function playSpinSound(duration) {
  let startTime = audioCtx.currentTime;
  let interval = 0.1;
  let count = Math.floor(duration / (interval * 1000));
  for (let i = 0; i < count; i++) {
    setTimeout(() => playClick(), i * interval * 1000);
  }
}

function playResultSound() {
  playTone(400, 'square', 0.3, 0.15);
  setTimeout(() => playTone(600, 'sawtooth', 0.2, 0.1), 300);
  setTimeout(() => playTone(800, 'triangle', 0.15, 0.08), 500);
}

function fetchGameData() {
  return fetch(gameDataUrl)
    .then((res) => {
      if (!res.ok) throw new Error('Failed to load gameData.json');
      return res.json();
    })
    .catch(() => {
      console.warn('Failed to load gameData.json, using fallback data');
      return null;
    });
}

function initGame(data) {
  gameData = data || {
    title: 'Ara Ara, Excusez Moi !',
    startTime: '18:00',
    initialPrompt: 'Que fait le paon fou ce soir ?',
    initialImages: ['paon9.PNG', 'paon10.PNG'],
    choices: []
  };

  document.title = gameData.title;
  startTimeEl.textContent = gameData.startTime || '18:00';
  promptEl.textContent = gameData.initialPrompt || 'Que fait le paon fou ce soir ?';

  if (gameData.initialImages && gameData.initialImages.length >= 2) {
    altA.src = gameData.initialImages[0];
    altB.src = gameData.initialImages[1];
    startAlternator();
  }

  if (!gameData.choices.length) {
    // fallback choices
    gameData.choices = [
      { id: 1, text: 'Rentrer chez lui se reposer', image: 'paon1.PNG', emoji: '😴', drinks: { pinte: 0, jagger: 0, whisky: 0 } },
      { id: 2, text: 'Rentrer pour geeker toute la nuit', image: 'paon7.PNG', emoji: '🤓', drinks: { pinte: 0, jagger: 6, whisky: 0 } },
      { id: 3, text: 'Réunion au Cavendish', image: 'paon5.PNG', emoji: '💼', drinks: { pinte: 0, jagger: 0, whisky: 6 } }
    ];
  }

  drawWheel();

  enterBtn.addEventListener('click', () => {
    home.classList.add('hidden');
    game.classList.remove('hidden');
    playTone(440, 'sine', 0.5, 0.1);
  });

  restartBtn.addEventListener('click', () => {
    location.reload();
  });

  spinBtn.addEventListener('click', () => startSpin(false));
  fastSpinBtn && fastSpinBtn.addEventListener('click', () => startSpin(true));

  nextBtn.addEventListener('click', () => {
    resultCard.classList.add('hidden');
    promptEl.textContent = 'Que fait le paon fou maintenant ?';
    startAlternator();
    moodText.textContent = 'Didier est prêt pour une nouvelle aventure... ou pas.';
  });
}

function startAlternator() {
  stopAlternator();
  let showA = true;
  altA.classList.add('show');
  altB.classList.remove('show');
  altInterval = setInterval(() => {
    showA = !showA;
    if (showA) {
      altA.classList.add('show');
      altB.classList.remove('show');
    } else {
      altA.classList.remove('show');
      altB.classList.add('show');
    }
  }, 900);
}

function stopAlternator() {
  if (altInterval) {
    clearInterval(altInterval);
    altInterval = null;
  }
}

function drawWheel() {
  const choices = gameData.choices;
  const n = choices.length;
  const cw = wheelCanvas.width;
  const ch = wheelCanvas.height;
  const cx = cw / 2;
  const cy = ch / 2;
  const r = Math.min(cx, cy) - 8;
  const sector = (Math.PI * 2) / n;

  ctx.clearRect(0, 0, cw, ch);

  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = 'rgba(0,0,0,0.14)';
  ctx.arc(cx + 4, cy + 6, r + 8, 0, Math.PI * 2);
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

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + sector / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#f6f0ff';
    ctx.font = 'bold 14px "Press Start 2P", cursive, Inter, sans-serif';
    const label = `${choices[i].emoji || ''} ${choices[i].text}`;
    ctx.fillText(shorten(label, 26), r - 10, 6);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.fillStyle = '#0a0a1a';
  ctx.arc(cx, cy, 48, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#9db7ff';
  ctx.font = '700 12px "Press Start 2P", cursive, Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Le destin de Didier', cx, cy + 4);
}

function shorten(str, max) {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + '…';
}

function startSpin(fast = false) {
  if (isSpinning) return;
  stopAlternator();
  isSpinning = true;
  resultCard.classList.add('hidden');

  const n = gameData.choices.length;
  const targetIndex = Math.floor(Math.random() * n);
  const sectorAngle = (Math.PI * 2) / n;
  const rotations = fast ? 6 : 12;
  const randomOffset = (Math.random() * sectorAngle * 0.8) - sectorAngle * 0.4;
  const finalAngle = rotations * Math.PI * 2 + targetIndex * sectorAngle + sectorAngle / 2 + randomOffset;

  const start = performance.now();
  const duration = fast ? 1400 : 3600;
  const initial = wheelAngle;
  const target = wheelAngle + finalAngle;

  playSpinSound(duration);

  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    const ease = 1 - Math.pow(1 - t, 3);
    wheelAngle = initial + (target - initial) * ease;
    renderWheelRotation(wheelAngle);
    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      isSpinning = false;
      const normalized = (wheelAngle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      const index = Math.floor(((normalized + Math.PI / 2) / sectorAngle)) % n;
      const selected = (n - index) % n;
      revealResult(selected);
    }
  }
  requestAnimationFrame(frame);
}

function renderWheelRotation(angle) {
  const cw = wheelCanvas.width;
  const ch = wheelCanvas.height;
  ctx.clearRect(0, 0, cw, ch);
  ctx.save();
  ctx.translate(cw / 2, ch / 2);
  ctx.rotate(angle);
  ctx.translate(-cw / 2, -ch / 2);
  drawWheel();
  ctx.restore();
}

function revealResult(index) {
  const choice = gameData.choices[index];
  if (!choice) {
    console.error('choice not found', index);
    return;
  }

  playResultSound();

  const totalDrinks = (choice.drinks.pinte || 0) + (choice.drinks.jagger || 0) + (choice.drinks.whisky || 0);

  resultImage.src = choice.image;
  resultText.textContent = choice.text;
  resultEmoji.textContent = choice.emoji || '';

  drinksList.innerHTML = '';
  addDrinkItem('Pinte de Mango', choice.drinks.pinte || 0);
  addDrinkItem('Jagger Bomb', choice.drinks.jagger || 0);
  addDrinkItem('Whisky', choice.drinks.whisky || 0);

  paonLevel.textContent = `Mood: ${paonLevelString(totalDrinks)} (${totalDrinks} verres bus)`;
  moodText.textContent = moodDescription(totalDrinks);

  resultCard.classList.remove('hidden');
  resultCard.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 420, easing: 'ease-out' });
}

function addDrinkItem(name, count) {
  const d = document.createElement('div');
  d.className = 'drink-item';
  d.innerHTML = `<div>${name}</div><div>${count} ${count > 1 ? 'verres' : 'verre'}</div>`;
  drinksList.appendChild(d);
}

function paonLevelString(total) {
  if (total <= 0) return 'Calme';
  if (total <= 12) return 'Éveillé';
  if (total <= 24) return 'Chaud';
  return 'PAON FOU !!!';
}

function moodDescription(total) {
  if (total <= 0) return "Didier est calme et sérieux, prêt pour une soirée tranquille.";
  if (total <= 12) return "Didier est éveillé, un peu chaud mais toujours maître de lui.";
  if (total <= 24) return "Didier est chaud, la soirée s'anime sérieusement.";
  return "Didier est PAON FOU, la fête est totale, attention aux dégâts !";
}

function playSpinSound(duration) {
  let startTime = audioCtx.currentTime;
  let interval = 0.1;
  let count = Math.floor(duration / (interval * 1000));
  for (let i = 0; i < count; i++) {
    setTimeout(() => playTone(800 + Math.random() * 400, 'triangle', 0.05, 0.05), i * interval * 1000);
  }
}

function playResultSound() {
  playTone(400, 'square', 0.3, 0.15);
  setTimeout(() => playTone(600, 'sawtooth', 0.2, 0.1), 300);
  setTimeout(() => playTone(800, 'triangle', 0.15, 0.08), 500);
}

fetchGameData().then(initGame);
