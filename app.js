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

  // DONNÉES INTÉGRÉES POUR ÉVITER LES ERREURS DE CHARGEMENT
  const gameData = {
    "choices": [
      { "text": "Rentrer chez lui se reposer", "image": "paon9.PNG", "emoji": "😴", "drinks": { "p": 2, "j": 0, "w": 1 } },
      { "text": "Rentrer pour geeker toute la nuit", "image": "paon7.PNG", "emoji": "🤓", "drinks": { "p": 1, "j": 4, "w": 0 } },
      { "text": "Réunion au Cavendish", "image": "paon5.PNG", "emoji": "💼", "drinks": { "p": 0, "j": 0, "w": 30 } },
      { "text": "Faire la fête avec Vince", "image": "paon11.PNG", "emoji": "💃", "drinks": { "p": 5, "j": 3, "w": 3 } },
      { "text": "Soirée tranquille sans alcool", "image": "paon3.PNG", "emoji": "🕶️", "drinks": { "p": 0, "j": 0, "w": 0 } },
      { "text": "Soirée de fou", "image": "paon6.PNG", "emoji": "🎉", "drinks": { "p": 8, "j": 5, "w": 5 } },
      { "text": "After chez Manon", "image": "paon1.PNG", "emoji": "😇", "drinks": { "p": 6, "j": 4, "w": 2 } },
      { "text": "Se finir avec El Predator", "image": "paon4.PNG", "emoji": "😭", "drinks": { "p": 7, "j": 2, "w": 80 } }
    ]
  };

  let spinning = false;
  let currentAngle = 0;

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
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.2, 0, 2 * Math.PI);
    ctx.fillStyle = '#1a0f3f';
    ctx.fill();
  }

  function spinWheel() {
    if (spinning) return;
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

  function showResult(index) {
    const choice = gameData.choices[index];
    resultImage.src = choice.image;
    resultText.textContent = choice.text;
    resultEmoji.textContent = choice.emoji;
    drinkP.textContent = choice.drinks.p;
    drinkJ.textContent = choice.drinks.j;
    drinkW.textContent = choice.drinks.w;
    const total = choice.drinks.p + choice.drinks.j + choice.drinks.w;
    paonMood.textContent = total > 50 ? "PAON FOU MAXIMUM !" : "Le paon s'échauffe...";
    resultPanel.classList.add('show');
  }

  enterBtn.addEventListener('click', () => {
    home.style.display = 'none';
    game.style.display = 'flex';
    drawWheel();
  });

  spinBtn.addEventListener('click', spinWheel);
  closeResult.addEventListener('click', () => resultPanel.classList.remove('show'));
});
