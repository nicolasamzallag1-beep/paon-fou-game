document.addEventListener('DOMContentLoaded', () => {
  const home = document.getElementById('home');
  const game = document.getElementById('game');
  const enterBtn = document.getElementById('enterBtn');
  const spinBtn = document.getElementById('spinBtn');
  const wheel = document.getElementById('wheel');
  const ctx = wheel.getContext('2d');
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

  // CETTE FONCTION VA CHERCHER TES SCORES DANS GAMEDATA.JSON
  async function loadData() {
    try {
      const res = await fetch('gameData.json');
      gameData = await res.json();
      drawWheel();
    } catch (e) {
      console.error("Erreur de chargement JSON");
    }
  }

  function drawWheel() {
    const n = gameData.choices.length;
    const arc = (2 * Math.PI) / n;
    const radius = wheel.width / 2 - 10;
    const centerX = wheel.width / 2;
    const centerY = wheel.height / 2;
    ctx.clearRect(0, 0, wheel.width, wheel.height);
    for (let i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.fillStyle = i % 2 === 0 ? '#3a1a6a' : '#2a154f';
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, i * arc, (i + 1) * arc);
      ctx.fill();
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(i * arc + arc / 2);
      ctx.fillStyle = '#d6a2e8';
      ctx.font = '28px serif';
      ctx.textAlign = 'center';
      ctx.fillText(gameData.choices[i].emoji, radius * 0.65, 10);
      ctx.restore();
    }
  }

  function spinWheel() {
    if (spinning || !gameData) return;
    spinning = true;
    spinBtn.disabled = true;
    const n = gameData.choices.length;
    const arc = (2 * Math.PI) / n;
    const targetIndex = Math.floor(Math.random() * n);
    const spins = 8;
    const targetAngle = spins * 2 * Math.PI + (n - targetIndex) * arc - arc / 2;
    const duration = 3000;
    const start = performance.now();
    function animate(time) {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      currentAngle = targetAngle * ease;
      wheel.style.transform = `rotate(${currentAngle}rad)`;
      if (progress < 1) requestAnimationFrame(animate);
      else {
        spinning = false;
        spinBtn.disabled = false;
        showResult(targetIndex);
      }
    }
    requestAnimationFrame(animate);
  }

  function getMood(total) {
    if (total === 0) return "Didier est sobre, soirée tranquille.";
    if (total < 10) return "Le paon s’échauffe doucement.";
    if (total < 20) return "Didier commence à s’amuser.";
    if (total < 30) return "Paon fou en action, ça bouge !";
    return "PAON FOU MAXIMUM ! Soirée légendaire.";
  }

  function showResult(index) {
    const choice = gameData.choices[index];
    resultImage.src = choice.image;
    resultText.textContent = choice.text;
    resultEmoji.textContent = choice.emoji;
    
    // ICI ON UTILISE LES VRAIS CHIFFRES DE TON JSON
    drinkP.textContent = choice.drinks.p;
    drinkJ.textContent = choice.drinks.j;
    drinkW.textContent = choice.drinks.w;
    
    const total = choice.drinks.p + choice.drinks.j + choice.drinks.w;
    paonMood.textContent = getMood(total);
    resultPanel.classList.add('show');
  }

  enterBtn.addEventListener('click', () => {
    home.style.display = 'none';
    game.style.display = 'flex';
    loadData(); // On charge les données au moment d'entrer
  });

  spinBtn.addEventListener('click', spinWheel);
  closeResult.addEventListener('click', () => resultPanel.classList.remove('show'));
});
