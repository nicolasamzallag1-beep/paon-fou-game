document.addEventListener('DOMContentLoaded', () => {
  let audioCtx = null;
  function ensureAudio(){
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  const home = document.getElementById('home');
  const intro = document.getElementById('intro');
  const game = document.getElementById('game');
  const resultPanel = document.getElementById('resultPanel');
  const wheel = document.getElementById('wheel');
  const ctx = wheel.getContext('2d');

  // CACHER LE PANNEAU DE RÉSULTAT AU DÉMARRAGE (Sécurité)
  resultPanel.classList.remove('show');

  let gameData = null;
  let spinning = false;

  async function loadData() {
    try {
      const res = await fetch('gameData.json');
      gameData = await res.json();
      drawWheel();
    } catch (e) { console.error("Erreur chargement JSON"); }
  }

  function drawWheel() {
    const n = gameData.choices.length;
    const arc = (2 * Math.PI) / n;
    for (let i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.fillStyle = i % 2 === 0 ? '#3a1a6a' : '#2a154f';
      ctx.moveTo(170, 170);
      ctx.arc(170, 170, 160, i * arc, (i + 1) * arc);
      ctx.fill();
      ctx.save();
      ctx.translate(170, 170);
      ctx.rotate(i * arc + arc / 2);
      ctx.fillStyle = '#fff';
      ctx.font = '24px Arial';
      ctx.fillText(gameData.choices[i].emoji, 120, 10);
      ctx.restore();
    }
  }

  document.getElementById('enterBtn').onclick = () => {
    ensureAudio();
    home.classList.add('hidden');
    intro.classList.remove('hidden');
    
    // Animation d'alternance d'images
    let toggle = true;
    const intId = setInterval(() => {
      document.getElementById('introImage').src = toggle ? 'paon10.PNG' : 'paon9.PNG';
      toggle = !toggle;
    }, 2000);

    document.getElementById('introCard').onclick = () => {
      clearInterval(intId);
      intro.classList.add('hidden');
      game.classList.remove('hidden');
      loadData();
    };
  };

  document.getElementById('spinBtn').onclick = () => {
    if (spinning) return;
    spinning = true;
    const n = gameData.choices.length;
    const targetIndex = Math.floor(Math.random() * n);
    const duration = 3000;
    const targetAngle = (Math.PI * 2 * 10) + (n - targetIndex) * (Math.PI * 2 / n);
    const start = performance.now();

    function animate(now) {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      wheel.style.transform = `rotate(${targetAngle * ease}rad)`;
      if (t < 1) requestAnimationFrame(animate);
      else {
        spinning = false;
        showResult(targetIndex);
      }
    }
    requestAnimationFrame(animate);
  };

  function showResult(idx) {
    const c = gameData.choices[idx];
    document.getElementById('resultImage').src = c.image;
    document.getElementById('resultText').innerText = c.text;
    document.getElementById('drinkP').innerText = c.drinks.p;
    document.getElementById('drinkJ').innerText = c.drinks.j;
    document.getElementById('drinkW').innerText = c.drinks.w;
    resultPanel.classList.add('show');
  }

  document.getElementById('closeResult').onclick = () => resultPanel.classList.remove('show');
});
