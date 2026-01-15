// app.js
// Charge gameData.json (avec fallback), dessine une roue, lance le spin, affiche résultat et joue sons simples via WebAudio.
// Si tu testes en local : utiliser `python -m http.server 8000` pour éviter problèmes de fetch.

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
  });
  restartBtn.addEventListener('click', () => {
    location.reload();
  });

  spinBtn.addEventListener('click', () => startSpin(false));
  fastSpinBtn.addEventListener('click', () => startSpin(true));

  nextBtn.addEventListener('click', () => {
    // Currently just hide result for simplicity; you could chain more interactions
    resultCard.classList.add('hidden');
    promptEl.textContent = "Que fait le paon fou maintenant ?";
    startAlternator();
  });

  // Prepare wheel
  if(gameData.choices && gameData.choices.length){
    drawWheel();
  } else {
    // fallback choices if none provided
    gameData.choices = [
      {id:1,text:"Rentrer chez lui se reposer",image:"paon1.PNG",emoji:"😴",drinks:{pinte:0,jagger:0,whisky:0}},
      {id:2,text:"Rentrer pour geeker toute la nuit",image:"paon7.PNG",emoji:"🤓",drinks:{pinte:0,jagger:1,whisky:0}},
      {id:3,text:"Réunion au Cavendish",image:"paon5.PNG",emoji:"💼",drinks:{pinte:0,jagger:0,whisky:1}}
    ];
    drawWheel();
  }
}

/* UI helpers */
function showGame(){
  home.classList.remove('active');
  home.classList.add('hidden');
  game.classList.add('active');
  // stop alternator on home enter and start new alternation in-game
  stopAlternator();
  startAlternator(); // ensure alternator runs in game area
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

  // clear
  ctx.clearRect(0, 0, cw, ch);

  // shadow/outer
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = "rgba(0,0,0,0.14)";
  ctx.arc(cx+4, cy+6, r+8, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();

  // draw sectors
  for(let i=0;i<n;i++){
    const start = i * sector - Math.PI/2;
    const end = start + sector;
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,r,start,end);
    ctx.closePath();
    // alternating colors
    ctx.fillStyle = i%2===0 ? '#2b1c5e' : '#3b2a78';
    ctx.fill();

    // separator stroke
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.stroke();

    // label
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + sector/2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#f6f0ff';
    ctx.font = 'bold 14px Inter, sans-serif';
    const label = `${choices[i].emoji||''} ${choices[i].text}`;
    // draw short text near edge
    ctx.fillText( shorten(label, 26), r - 10, 6);
    ctx.restore();
  }

  // center circle
  ctx.beginPath();
  ctx.fillStyle = '#0a0a1a';
  ctx.arc(cx, cy, 48, 0, Math.PI*2);
  ctx.fill();

  // title in center
  ctx.fillStyle = '#9db7ff';
  ctx.font = '700 12px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Le destin de Didier', cx, cy+4);
}

// Utility to shorten labels
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

  // pick a random target sector
  const n = gameData.choices.length;
  const targetIndex = Math.floor(Math.random()*n);
  // Compute target angle such that pointer (top) lands on that sector
  const sectorAngle = (Math.PI*2)/n;
  // Add multiple full rotations for drama
  const rotations = fast ? 6 : 12;
  const randomOffset = (Math.random() * sectorAngle * 0.8) - (sectorAngle*0.4); // small offset
  const finalAngle = rotations * Math.PI * 2 + (targetIndex * sectorAngle) + sectorAngle/2 + randomOffset;

  // animate from current wheelAngle to wheelAngle + finalAngle
  const start = performance.now();
  const duration = fast ? 1400 : 3600;
  const initial = wheelAngle;
  const target = wheelAngle + finalAngle;

  // Play spin sound
  playSpinSound(duration);

  function frame(now){
    const t = Math.min(1, (now - start)/duration);
    // ease out
    const ease = 1 - Math.pow(1-t, 3);
    wheelAngle = initial + (target - initial) * ease;
    // draw rotated canvas
    renderWheelRotation(wheelAngle);
    if(t < 1){
      requestAnimationFrame(frame);
    } else {
      isSpinning = false;
      // Compute landed sector index
      const normalized = (wheelAngle % (Math.PI*2) + Math.PI*2) % (Math.PI*2);
      const index = ( Math.floor( ((normalized + Math.PI/2) / sectorAngle) ) ) % n;
      // Because we rotated the wheel itself, the mapping may be reversed: compute selected = (n - index) % n
      const selected = (n - index) % n;
      revealResult(selected);
    }
  }
  requestAnimationFrame(frame);
}

function renderWheelRotation(angle){
  // draw wheel into an offscreen canvas then rotate?
  // simplest: clear and use save/translate/rotate/draw via drawWheel rotated
  const cw = wheelCanvas.width;
  const ch = wheelCanvas.height;
  ctx.clearRect(0,0,cw,ch);
  ctx.save();
  ctx.translate(cw/2, ch/2);
  ctx.rotate(angle);
  ctx.translate(-cw/2, -ch/2);
  // draw wheel static (reuse drawWheel's logic but split)
  drawWheel(); // drawWheel draws at angle 0; since we applied transform, it rotates
  ctx.restore();
}

/* Result handling */
function revealResult(index){
  const choice = gameData.choices[index];
  if(!choice){
    console.error('choice not found', index);
    return;
  }

  // Play clink sounds proportionally to drinks
  const totalDrinks = (choice.drinks.pinte || 0) + (choice.drinks.jagger || 0) + (choice.drinks.whisky || 0);
  playClinks(totalDrinks);

  // Fill result card
  resultImage.src = choice.image;
  resultText.textContent = choice.text;
  resultEmoji.textContent = choice.emoji || '';

  // Drinks list
  drinksList.innerHTML = '';
  addDrinkItem('Pinte de Mango', choice.drinks.pinte || 0);
  addDrinkItem('Jagger Bomb', choice.drinks.jagger || 0);
  addDrinkItem('Whisky', choice.drinks.whisky || 0);

  // Paon fou level
  const level = paonLevelString(totalDrinks);
  paonLevel.textContent = `Niveau Paon Fou : ${level} (${totalDrinks} verres)`;

  resultCard.classList.remove('hidden');
  // small animation flash
  resultCard.animate([{opacity:0, transform:'translateY(8px)'},{opacity:1, transform:'translateY(0)'}], {duration:420, easing:'ease-out'});
}

/* UI small helpers */
function addDrinkItem(name, count){
  const d = document.createElement('div');
  d.className = 'drink-item';
  d.innerHTML = `<div>${name}</div><div>${count} ${count>1?'verres':'verre'}</div>`;
  drinksList.appendChild(d);
}
function paonLevelString(total){
  if(total <= 0) return 'Calme';
  if(total <= 2) return 'Éveillé';
  if(total <= 4) return 'Chaud';
  return 'Paon Fou';
}

/* Sound: spin + clinks using WebAudio */
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function ensureAudio(){
  if(!audioCtx) audioCtx = new AudioCtx();
}

function playSpinSound(duration){
  // simple tone sweeping effect
  ensureAudio();
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(800, audioCtx.currentTime);
  o.frequency.exponentialRampToValueAtTime(180, audioCtx.currentTime + duration/1000);
  g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.08, audioCtx.currentTime + 0.08);
  g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration/1000);
  o.connect(g); g.connect(audioCtx.destination);
  o.start();
  o.stop(audioCtx.currentTime + duration/1000 + 0.05);
}

function playClinks(n){
  ensureAudio();
  // Play n short chiming sounds
  const now = audioCtx.currentTime;
  for(let i=0;i<n;i++){
    const delay = 0.12*i;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'triangle';
    const f = 600 + Math.random()*400;
    o.frequency.setValueAtTime(f, now + delay);
    g.gain.setValueAtTime(0.0001, now + delay);
    g.gain.linearRampToValueAtTime(0.12, now + delay + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.32);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(now + delay);
    o.stop(now + delay + 0.36);
  }
}
