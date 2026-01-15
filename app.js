let gameData = null;
let currentAngle = 0;
let isSpinning = false;

const homeScreen = document.getElementById('home');
const gameScreen = document.getElementById('game');
const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');

// Initialisation
async function init() {
  try {
    const res = await fetch('gameData.json');
    gameData = await res.json();
    drawWheel();
  } catch (e) { console.error("Erreur chargement JSON"); }
}

// Navigation
document.getElementById('enterBtn').onclick = () => {
  homeScreen.classList.replace('active', 'hidden');
  gameScreen.classList.replace('hidden', 'active');
  startAlternator();
};

document.getElementById('restartBtn').onclick = () => location.reload();

// Alternateur d'images
function startAlternator() {
  let step = 0;
  setInterval(() => {
    step++;
    document.getElementById('altImgA').classList.toggle('show', step % 2 === 0);
    document.getElementById('altImgB').classList.toggle('show', step % 2 !== 0);
  }, 1000);
}

// Dessin de la roue
function drawWheel() {
  const n = gameData.choices.length;
  const arc = (Math.PI * 2) / n;
  const cx = 180, cy = 180, r = 170;

  ctx.clearRect(0, 0, 360, 360);
  gameData.choices.forEach((choice, i) => {
    const angle = i * arc;
    ctx.beginPath();
    ctx.fillStyle = i % 2 === 0 ? '#2b1c5e' : '#3b2a78';
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + arc);
    ctx.fill();
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle + arc / 2);
    ctx.fillStyle = "white";
    ctx.font = "bold 12px Arial";
    ctx.fillText(choice.text.substring(0, 15), 70, 5);
    ctx.restore();
  });
}

// Logique du Spin
document.getElementById('spinBtn').onclick = () => {
  if (isSpinning) return;
  isSpinning = true;
  document.getElementById('resultCard').classList.add('hidden');
  
  const n = gameData.choices.length;
  const choiceIndex = Math.floor(Math.random() * n);
  const extraSpins = 5 * 360;
  const finalRotation = extraSpins + (choiceIndex * (360 / n));
  
  const start = performance.now();
  const duration = 3000;

  function animate(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const angle = easeOut * finalRotation;
    
    canvas.style.transform = `rotate(${angle}deg)`;
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      isSpinning = false;
      showResult(n - 1 - choiceIndex);
    }
  }
  requestAnimationFrame(animate);
};

function showResult(index) {
  const choice = gameData.choices[index];
  document.getElementById('resultImage').src = choice.image;
  document.getElementById('resultText').innerText = choice.text;
  document.getElementById('resultEmoji').innerText = choice.emoji;
  
  const list = document.getElementById('drinksList');
  list.innerHTML = `
    <div class="drink-item"><span>Pinte Mango</span> <span>${choice.drinks.p}</span></div>
    <div class="drink-item"><span>Jagger Bomb</span> <span>${choice.drinks.j}</span></div>
    <div class="drink-item"><span>Whisky</span> <span>${choice.drinks.w}</span></div>
  `;
  
  const total = choice.drinks.p + choice.drinks.j + choice.drinks.w;
  document.getElementById('paonLevel').innerText = `Total: ${total} verres`;
  document.getElementById('resultCard').classList.remove('hidden');
}

document.getElementById('nextBtn').onclick = () => {
  document.getElementById('resultCard').classList.add('hidden');
};

init();
