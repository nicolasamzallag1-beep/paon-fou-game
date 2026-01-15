document.addEventListener('DOMContentLoaded', () => {
  const wheel = document.getElementById('wheel');
  const ctx = wheel.getContext('2d');
  const enterBtn = document.getElementById('enterBtn');
  const backBtn = document.getElementById('backBtn');
  const spinBtn = document.getElementById('spinBtn');
  const resultPanel = document.getElementById('resultPanel');
  const closeResult = document.getElementById('closeResult');
  const resultImage = document.getElementById('resultImage');
  const resultText = document.getElementById('resultText');
  const resultEmoji = document.getElementById('resultEmoji');
  const drinkP = document.getElementById('drinkP');
  const drinkJ = document.getElementById('drinkJ');
  const drinkW = document.getElementById('drinkW');
  const paonMood = document.getElementById('paonMood');

  let gameData = null;
  let spinning = false;
  let currentAngle = 0;

  // Resize canvas for DPI
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = wheel.getBoundingClientRect();
    wheel.width = rect.width * dpr;
    wheel.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Draw wheel sectors and emojis
  function drawWheel() {
    if (!gameData) return;
    const n = gameData.choices.length;
    const arc = (2 * Math.PI) / n;
    const radius = wheel.width / (2 * (window.devicePixelRatio || 1)) - 10;
    const centerX = wheel.width / (2 * (window.devicePixelRatio || 1));
    const centerY = wheel.height / (2 * (window.devicePixelRatio || 1));

    ctx.clearRect(0, 0, wheel.width, wheel.height);

    for (let i = 0; i < n; i++) {
      const startAngle = i * arc;
      const endAngle = startAngle + arc;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = i % 2 === 0 ? '#3a1a6a' : '#2a154f';
      ctx.fill();

      // Draw emoji
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + arc / 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '28px serif';
      ctx.fillStyle = '#d6a2e8';
      ctx.fillText(gameData.choices[i].emoji, radius * 0.65, 0);
      ctx.restore();
    }

    // Center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.2, 0, 2 * Math.PI);
    ctx.fillStyle = '#1a0f3f';
    ctx.fill();

    ctx.fillStyle = '#9b59b6';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Le destin de Didier', centerX, centerY + 5);
  }

  // Animate spin
  function spinWheel() {
    if (spinning) return;
    spinning = true;
    spinBtn.disabled = true;

    const n = gameData.choices.length;
    const arc = (2 * Math.PI) / n;
    const targetIndex = Math.floor(Math.random() * n);

    // Calculate final angle so pointer lands on target sector
    const spins = 6 + Math.floor(Math.random() * 4);
    const targetAngle = spins * 2 * Math.PI + (n - targetIndex) * arc - arc / 2;

    const duration = 3000;
    const start = performance.now();

    function animate(time) {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      currentAngle = targetAngle * easedProgress;
      wheel.style.transform = `rotate(${currentAngle}rad)`;
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        spinning = false;
        spinBtn.disabled = false;
        showResult(targetIndex);
      }
    }
    requestAnimationFrame(animate);
  }

  // Mood phrases punchy & variées
  function getMood(total) {
    if (total === 0) return "Didier est sobre comme un juge. Soirée zen, pas de dégâts.";
    if (total < 20) return "Le paon s’échauffe, ça va chauffer doucement.";
    if (total < 40) return "Didier commence à faire le show, attention aux dégâts.";
    if (total < 60) return "Paon fou en action, ça va swinguer sévère.";
    if (total < 80) return "Didier est chaud bouillant, la soirée dérape.";
    return "PAON FOU MAXIMUM ! Didier est une légende vivante, souvenirs flous garantis.";
  }

  // Show result overlay
  function showResult(index) {
    const choice = gameData.choices[index];
    resultImage.src = choice.image;
    resultText.textContent = choice.text;
    resultEmoji.textContent = choice.emoji;
    drinkP.textContent = choice.drinks.p;
    drinkJ.textContent = choice.drinks.j;
    drinkW.textContent = choice.drinks.w;

    const totalDrinks = choice.drinks.p + choice.drinks.j + choice.drinks.w;
    paonMood.textContent = getMood(totalDrinks);

    resultPanel.setAttribute('aria-hidden', 'false');
    resultPanel.classList.add('show');

    // Play short sound
    playSound(440, 0.3, 'square');
  }

  // Play simple beep sound
  function playSound(freq, duration, type = 'sine') {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);

    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  }

  // Event listeners
  enterBtn.addEventListener('click', () => {
    document.getElementById('home').classList.add('hidden');
    document.getElementById('game').classList.remove('hidden');
    resizeCanvas();
    drawWheel();
  });

  backBtn.addEventListener('click', () => {
    location.reload();
  });

  spinBtn.addEventListener('click', spinWheel);

  closeResult.addEventListener('click', () => {
    resultPanel.setAttribute('aria-hidden', 'true');
    resultPanel.classList.remove('show');
  });

  // Resize canvas on window resize
  window.addEventListener('resize', () => {
    resizeCanvas();
    drawWheel();
  });

  // Initial setup
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = wheel.getBoundingClientRect();
    wheel.width = rect.width * dpr;
    wheel.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Load game data
  async function loadGameData() {
    const response = await fetch('gameData.json');
    gameData = await response.json();
  }

  (async () => {
    await loadGameData();
    resizeCanvas();
    drawWheel();
  })();
});
