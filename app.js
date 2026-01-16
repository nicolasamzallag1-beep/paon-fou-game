document.addEventListener('DOMContentLoaded', () => {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  
  // Fonction pour jouer un son
  function playSound(freq, type, duration) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  function playSpinSound() { playSound(150, 'sawtooth', 0.1); }
  function playWinSound() { 
    playSound(440, 'sine', 0.2); 
    setTimeout(() => playSound(660, 'sine', 0.4), 150);
  }

  const home = document.getElementById('home');
  const intro = document.getElementById('intro');
  const game = document.getElementById('game');
  const wheel = document.getElementById('wheel');
  const ctx = wheel.getContext('2d');
  let gameData = null;
  let currentAngle = 0;

  async function loadData() {
    const res = await fetch('gameData.json');
    gameData = await res.json();
    drawWheel();
  }

  function drawWheel() {
    const n = gameData.choices.length;
    const arc = (2 * Math.PI) / n;
    for (let i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.fillStyle = i % 2 === 0 ? '#3a1a6a' : '#2a154f';
      ctx.moveTo(160, 160);
      ctx.arc(160, 160, 150, i * arc, (i + 1) * arc);
      ctx.fill();
      ctx.save();
      ctx.translate(160, 160);
      ctx.rotate(i * arc + arc / 2);
      ctx.fillStyle = '#fff';
      ctx.font = '20px Arial';
      ctx.fillText(gameData.choices[i].emoji, 110, 10);
      ctx.restore();
    }
  }

  function spin() {
    playSpinSound();
    const n = gameData.choices.length;
    const targetIndex = Math.floor(Math.random() * n);
    const duration = 3000;
    const targetAngle = (10 * Math.PI * 2) + (n - targetIndex) * (Math.PI * 2 / n);
    const start = performance.now();

    function animate(now) {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      currentAngle = targetAngle * ease;
      wheel.style.transform = `rotate(${currentAngle}rad)`;
      if (t < 1) requestAnimationFrame(animate);
      else {
        playWinSound();
        showResult(targetIndex);
      }
    }
    requestAnimationFrame(animate);
  }

  function getMood(total) {
    if (total === 0) return "Didier est sobre, soirée tranquille.";
    if (total < 5) return "Le paon s’échauffe doucement.";
    if (total < 10) return "Didier commence à s’amuser.";
    if (total < 15) return "Paon fou en action, ça bouge !";
    return "PAON FOU MAXIMUM ! Soirée légendaire.";
  }

  function showResult(idx) {
    const c = gameData.choices[idx];
    document.getElementById('resultImage').src = c.image;
    document.getElementById('resultText').innerText = c.text;
    document.getElementById('drinkP').innerText = c.drinks.p;
    document.getElementById('drinkJ').innerText = c.drinks.j;
    document.getElementById('drinkW').innerText = c.drinks.w;
    document.getElementById('paonMood').innerText = getMood(c.drinks.p + c.drinks.j + c.drinks.w);
    document.getElementById('resultPanel').classList.add('show');
  }

  document.getElementById('enterBtn').onclick = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    home.style.display = 'none';
    intro.style.display = 'block';
    let toggle = true;
    setInterval(() => {
      document.getElementById('introImage').src = toggle ? 'paon10.PNG' : 'paon9.PNG';
      toggle = !toggle;
    }, 2000);
  };

  document.getElementById('startGameBtn').onclick = () => {
    intro.style.display = 'none';
    game.style.display = 'flex';
    loadData();
  };

  document.getElementById('spinBtn').onclick = spin;
  document.getElementById('closeResult').onclick = () => document.getElementById('resultPanel').classList.remove('show');
});
