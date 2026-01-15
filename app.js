// app.js - version fun, musique de fond, bruitages, mood, verres augmentés

const DEFAULT_DATA = {
  title: "Ara Ara, Excusez Moi !",
  coverImage: "paoncover.PNG",
  startTime: "18:00",
  initialPrompt: "Que fait le paon fou ce soir ?",
  initialImages: ["paon9.PNG", "paon10.PNG"],
  choices: []
};

let gameData = DEFAULT_DATA;

// Elements
const home = document.getElementById('home');
const game = document.getElementById('game');
const enterBtn = document.getElementById('enterBtn');
const restartBtn = document.getElementById('restartBtn');

const promptEl = document.getElementById('prompt');
const startTimeEl = document.getElementById('startTime');
const altA = document.getElementById('altImgA');
const altB = document.getElementById('altImgB');

const wheelCanvas = document.getElementById('wheel');
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

const bgMusic = document.getElementById('bgMusic');
const spinSound = document.getElementById('spinSound');
const resultSound = document.getElementById('resultSound');

let altInterval = null;

// Load data, then init
fetch('gameData.json')
  .then(r => {
    if (!r.ok) throw new Error('no json');
    return r.json();
  })
  .then(j => {
    gameData = {...DEFAULT_DATA, ...j};
    init();
  })
  .catch(e => {
    console.warn('gameData.json not loaded — using defaults', e);
    init();
  });

function init(){
  document.title = gameData.title || "Ara Ara, Excusez Moi !";
  startTimeEl.textContent = gameData.startTime || "18:00";
  promptEl.textContent = gameData.initialPrompt || "Que fait le paon fou ce soir ?";

  // Setup alternation images
  if(gameData.initialImages && gameData.initialImages.length >= 2){
    altA.src = gameData.initialImages[0];
    altB.src = gameData.initialImages[1];
    startAlternator();
  }

  // Hook buttons
  enterBtn.addEventListener('click', () => {
    showGame();
    bgMusic.play().catch(() => {}); // play bg music on user interaction
  });
  restartBtn.addEventListener('click', () => {
    location.reload();
  });

  spinBtn.addEventListener('click', () => startSpin(false));
  fastSpinBtn.addEventListener('click', () => startSpin(true));

  nextBtn.addEventListener('click', () => {
    resultCard.classList.add('hidden');
    promptEl.textContent = "Que fait le paon fou maintenant ?";
    startAlternator();
    moodText.textContent = "Didier est prêt pour une nouvelle aventure... ou pas.";
  });

  // Prepare wheel
  if(gameData.choices && gameData.choices.length){
    drawWheel();
  } else {
    gameData.choices = [
      {id:1,text:"Rentrer chez lui se reposer",image:"paon1.PNG",emoji:"😴",drinks:{pinte:0,jagger:0,whisky:0}},
      {id:2,text:"Rentrer pour geeker toute la nuit",image:"paon7.PNG",emoji:"🤓",drinks:{pinte:0,jagger:3,whisky:0}},
      {id:3,text:"Réunion au Cavendish",image:"paon5.PNG",emoji:"💼",drinks:{pinte:0,jagger:0,whisky:3}}
    ];
    drawWheel();
  }
}

/* UI helpers */
function showGame(){
  home.classList.remove('active');
  home.classList.add('hidden');
  game.classList.remove('hidden');
  game.classList.add('active');
  stopAlternator();
  startAlternator();
}

/* Alternating initial images */
function startAlternator(){
  stopAlternator();
  let showA = true;
  altA.classList.add('show');
  altB.classList.remove('show');
  altInterval = setInterval(() => {
    showA = !showA;
    if(showA){
      altA.classList.add('show');
      altB.classList.remove('show');
    } else {
      altA.classList.remove('show');
      altB.classList.add('show');
    }
  }, 900);
}
function stopAlternator(){
  if(altInterval){ clearInterval(altInterval); altInterval = null; }
}

/* Wheel logic (canvas) */
const ctx = wheelCanvas.getContext('2d');
let wheelAngle = 0;
let isSpinning = false;

function drawWheel(){
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
  ctx.fillStyle = "rgba(0,0,0,0.14)";
  ctx.arc(cx+4, cy+6, r+8, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();

  for(let i=0;i<n;i++){
    const start = i * sector - Math.PI/2;
    const end = start + sector;
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,r,start,end);
    ctx.closePath();
    ctx.fillStyle = i%2===0 ? '#2b1c5e' : '#3b2a78';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + sector/2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#f6f0ff';
    ctx.font = 'bold 14px "Press Start 2P", cursive, Inter, sans-serif';
    const label = `${choices[i].emoji||''} ${choices[i].text}`;
    ctx.fillText(shorten(label, 26), r - 10, 6);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.fillStyle = '#0a0a1a';
  ctx.arc(cx, cy, 48, 0, Math.PI*2);
  ctx.fill();

  ctx.fillStyle = '#9db7ff';
  ctx.font = '700 12px "Press Start 2P", cursive, Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Le destin de Didier', cx, cy+4);
}

function shorten(str, max){
  if(str.length <= max) return str;
  return str.slice(0,max-1) + '…';
}

/* Spin animation */
function startSpin(fast=false){
  if(isSpinning) return;
  stopAlternator();
  isSpinning = true;
  resultCard.classList.add('hidden');

  const n = gameData.choices.length;
  const targetIndex = Math.floor(Math.random()*n);
  const sectorAngle = (Math.PI*2)/n;
  const rotations = fast ? 6 : 12;
  const randomOffset = (Math.random() * sectorAngle * 0.8) - (sectorAngle*0.4);
  const finalAngle = rotations * Math.PI * 2 + (targetIndex * sectorAngle) + sectorAngle/2 + randomOffset;

  const start = performance.now();
  const duration = fast ? 1400 : 3600;
  const initial = wheelAngle;
  const target = wheelAngle + finalAngle;

  playSound(spinSound, duration);

  function frame(now){
    const t = Math.min(1, (now - start)/duration);
    const ease = 1 - Math.pow(1-t, 3);
    wheelAngle = initial + (target - initial) * ease;
    renderWheelRotation(wheelAngle);
    if(t < 1){
      requestAnimationFrame(frame);
    } else {
      isSpinning = false;
      const normalized = (wheelAngle % (Math.PI*2) + Math.PI*2) % (Math.PI*2);
      const index = ( Math.floor( ((normalized + Math.PI/2) / sectorAngle) ) ) % n;
      const selected = (n - index) % n;
      revealResult(selected);
    }
  }
  requestAnimationFrame(frame);
}

function renderWheelRotation(angle){
  const cw = wheelCanvas.width;
  const ch = wheelCanvas.height;
  ctx.clearRect(0,0,cw,ch);
  ctx.save();
  ctx.translate(cw/2, ch/2);
  ctx.rotate(angle);
  ctx.translate(-cw/2, -ch/2);
  drawWheel();
  ctx.restore();
}

function revealResult(index){
  const choice = gameData.choices[index];
  if(!choice){
    console.error('choice not found', index);
    return;
  }

  playSound(resultSound);

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
  resultCard.animate([{opacity:0, transform:'translateY(8px)'},{opacity:1, transform:'translateY(0)'}], {duration:420, easing:'ease-out'});
}

function addDrinkItem(name, count){
  const d = document.createElement('div');
  d.className = 'drink-item';
  d.innerHTML = `<div>${name}</div><div>${count} ${count>1?'verres':'verre'}</div>`;
  drinksList.appendChild(d);
}

function paonLevelString(total){
  if(total <= 0) return 'Calme';
  if(total <= 6) return 'Éveillé';
  if(total <= 12) return 'Chaud';
  return 'Paon Fou';
}

function moodDescription(total){
  if(total <= 0) return "Didier est calme et sérieux, prêt pour une soirée tranquille.";
  if(total <= 6) return "Didier est éveillé, un peu chaud mais toujours maître de lui.";
  if(total <= 12) return "Didier est chaud, la soirée s'anime sérieusement.";
  return "Didier est Paon Fou, la fête est totale, attention aux dégâts !";
}

function playSound(audioElement, duration=0){
  if(!audioElement) return;
  audioElement.currentTime = 0;
  audioElement.play().catch(() => {});
  if(duration > 0){
    setTimeout(() => {
      audioElement.pause();
    }, duration);
  }
}
