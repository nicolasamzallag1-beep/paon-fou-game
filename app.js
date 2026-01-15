// app.js - version finale : texte de roue lisible, canvas DPI-aware, pas de musique de fond,
// sons courts (clic + résultat), image "paon1.PNG" réservée à "After chez Manon".

const GAME_DATA = 'gameData.json';

let data = null;
let wheelAngle = 0;
let isSpinning = false;
let altInterval = null;

const home = document.getElementById('home');
const game = document.getElementById('game');
const enterBtn = document.getElementById('enterBtn');
const restartBtn = document.getElementById('restartBtn');

const promptEl = document.getElementById('prompt');
const startTimeEl = document.getElementById('startTime');
const altA = document.getElementById('altImgA');
const altB = document.getElementById('altImgB');

const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');

const spinBtn = document.getElementById('spinBtn');

const resultCard = document.getElementById('resultCard');
const resultImage = document.getElementById('resultImage');
const resultText = document.getElementById('resultText');
const resultEmoji = document.getElementById('resultEmoji');
const drinksList = document.getElementById('drinksList');
const paonLevel = document.getElementById('paonLevel');
const nextBtn = document.getElementById('nextBtn');

const moodText = document.getElementById('moodText');

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// --------------- simple sounds (no files) ----------------
function beep(freq = 700, type = 'sine', duration = 0.06, vol = 0.06) {
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, audioCtx.currentTime);
  g.gain.setValueAtTime(vol, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + duration);
}
function spinClicks(durationMs) {
  const count = Math.max(6, Math.floor(durationMs / 160));
  for (let i=0;i<count;i++){
    setTimeout(()=> beep(700 + Math.random()*600, 'triangle', 0.03, 0.035), i*140);
  }
}
function resultChime() {
  beep(380,'square',0.12,0.09);
  setTimeout(()=>beep(640,'sawtooth',0.12,0.07),160);
  setTimeout(()=>beep(900,'triangle',0.09,0.05),320);
}

// --------------- fetch & init ----------------
async function fetchData(){
  try{
    const res = await fetch(GAME_DATA);
    if(!res.ok) throw new Error('no data');
    return await res.json();
  }catch(e){
    console.warn('Impossible de charger gameData.json, fallback minimal.');
    return null;
  }
}

function init(d){
  data = d || { title:'Ara Ara, Excusez Moi !', startTime:'18:00', initialPrompt:'Que fait le paon fou ce soir ?', initialImages:['paon9.PNG','paon10.PNG'], choices:[] };
  document.title = data.title;
  startTimeEl.textContent = data.startTime || '18:00';
  promptEl.textContent = data.initialPrompt || '';

  if(data.initialImages && data.initialImages.length>=2){
    altA.src = data.initialImages[0];
    altB.src = data.initialImages[1];
    startAlternator();
  }

  // Canvas sizing (dpi aware)
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  drawWheel();

  enterBtn.addEventListener('click', () => {
    // resume audio context on user gesture for Safari/Chrome autoplay policy
    if(audioCtx.state === 'suspended') audioCtx.resume();
    home.classList.add('hidden'); game.classList.remove('hidden'); game.setAttribute('aria-hidden','false');
    beep(440,'sine',0.12,0.08);
  });

  restartBtn.addEventListener('click', ()=> location.reload());
  spinBtn.addEventListener('click', ()=> startSpin());
  nextBtn.addEventListener('click', ()=> {
    resultCard.classList.add('hidden');
    startAlternator();
    moodText.textContent = 'Didier est prêt pour une nouvelle aventure...';
  });
}

// --------------- alternator ----------------
function startAlternator(){
  stopAlternator();
  let show = true;
  altA.classList.add('show'); altB.classList.remove('show');
  altInterval = setInterval(()=> {
    show = !show;
    if(show){ altA.classList.add('show'); altB.classList.remove('show'); }
    else { altA.classList.remove('show'); altB.classList.add('show'); }
  }, 900);
}
function stopAlternator(){ if(altInterval){ clearInterval(altInterval); altInterval = null; } }

// --------------- canvas helpers ----------------
function resizeCanvas(){
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(200, Math.floor(rect.width * dpr));
  canvas.height = Math.max(200, Math.floor(rect.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawWheel();
}

function drawWheel(){
  if(!data || !data.choices || data.choices.length===0){
    // fallback simple wheel
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#2c1b55'; ctx.fillRect(0,0,canvas.width/ (window.devicePixelRatio||1), canvas.height/(window.devicePixelRatio||1));
    return;
  }

  const choices = data.choices;
  const n = choices.length;
  const cw = canvas.clientWidth;
  const ch = canvas.clientHeight;
  const cx = cw/2, cy = ch/2;
  const r = Math.min(cx,cy) - 8;
  const sector = (Math.PI*2)/n;

  // clear
  ctx.clearRect(0,0,cw,ch);

  // outer glow
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx,cy,r+6,0,Math.PI*2);
  ctx.fillStyle = 'rgba(122,90,255,0.06)';
  ctx.fill();
  ctx.restore();

  // draw sectors
  for(let i=0;i<n;i++){
    const start = i*sector - Math.PI/2;
    const end = start + sector;
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,r,start,end);
    ctx.closePath();
    ctx.fillStyle = (i%2===0)?'#2b1c5e':'#3b2a78';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.stroke();

    // label
    const mid = start + sector/2;
    const label = (choices[i].emoji?choices[i].emoji+' ':'') + choices[i].text;
    drawSectorLabel(ctx, label, cx, cy, r*0.66, mid, 14, '#f6f0ff');
  }

  // center circle
  ctx.beginPath();
  ctx.arc(cx,cy,48,0,Math.PI*2);
  ctx.fillStyle = '#0b0713';
  ctx.fill();

  ctx.fillStyle = '#9db7ff';
  ctx.font = '700 12px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Le destin de Didier', cx, cy+4);
}

/**
 * drawSectorLabel
 * - context: 2D ctx
 * - text: label (may be long)
 * - cx,cy: center
 * - radius: distance from center to place the text
 * - angle: middle angle in radians
 * - fontSize: px
 * - color: fillStyle
 *
 * This rotates & flips automatically to keep text readable.
 */
function drawSectorLabel(context, text, cx, cy, radius, angle, fontSize=14, color='#fff'){
  context.save();
  context.translate(cx, cy);
  // rotate to angle + 90deg so the text faces outward
  context.rotate(angle + Math.PI/2);

  // flip if upside down to keep upright
  const deg = (angle * 180 / Math.PI) % 360;
  const normalizedDeg = (deg + 360) % 360;
  if(normalizedDeg > 90 && normalizedDeg < 270){
    context.rotate(Math.PI); // flip
  }

  context.fillStyle = color;
  context.font = `700 ${fontSize}px Inter, Arial, sans-serif`;
  context.textAlign = 'center';

  // wrap text into lines based on maxWidth
  const maxWidth = radius * 1.2; // allow longer labels
  const lines = wrapTextLines(context, text, maxWidth);

  // draw lines centered
  const lineHeight = fontSize * 1.05;
  const totalHeight = lines.length * lineHeight;
  let y0 = - (totalHeight / 2) + (lineHeight/2);

  for(let i=0;i<lines.length;i++){
    context.fillText(lines[i], 0, y0 + i*lineHeight);
  }

  context.restore();
}

/** returns array of lines */
function wrapTextLines(ctx, text, maxWidth){
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for(let i=0;i<words.length;i++){
    const test = line ? (line + ' ' + words[i]) : words[i];
    const w = ctx.measureText(test).width;
    if(w > maxWidth && line){
      lines.push(line);
      line = words[i];
    } else {
      line = test;
    }
  }
  if(line) lines.push(line);
  // if still too many characters in one line, try to trim long middle words
  return lines.map(l => l.length > 28 ? l.slice(0,28)+'…' : l);
}

// --------------- spin logic ----------------
function startSpin(){
  if(isSpinning) return;
  if(!data || !data.choices || data.choices.length===0) return;
  stopAlternator();
  isSpinning = true;
  resultCard.classList.add('hidden');

  const n = data.choices.length;
  const sector = (Math.PI*2)/n;
  const targetIndex = Math.floor(Math.random() * n); // random result
  const rotations = 10 + Math.floor(Math.random()*4);
  const randomOffset = (Math.random() * sector * 0.8) - sector*0.4;
  const finalAngle = rotations * Math.PI * 2 + targetIndex * sector + sector/2 + randomOffset;

  const startTime = performance.now();
  const duration = 3200 + Math.floor(Math.random()*800);
  const initial = wheelAngle;
  const target = initial + finalAngle;

  spinClicks(duration);

  function frame(now){
    const t = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - t, 3); // ease out cubic
    wheelAngle = initial + (target - initial) * eased;
    renderRotation(wheelAngle);
    if(t < 1){
      requestAnimationFrame(frame);
    } else {
      isSpinning = false;
      // compute selected index
      const normalized = (wheelAngle % (Math.PI*2) + Math.PI*2) % (Math.PI*2);
      const idx = Math.floor(((normalized + Math.PI/2) / sector)) % n;
      const selected = (n - idx) % n;
      reveal(selected);
    }
  }
  requestAnimationFrame(frame);
}

function renderRotation(angle){
  // render rotated wheel by temporarily transforming ctx
  const cw = canvas.clientWidth, ch = canvas.clientHeight;
  ctx.clearRect(0,0,cw,ch);
  ctx.save();
  ctx.translate(cw/2, ch/2);
  ctx.rotate(angle);
  ctx.translate(-cw/2, -ch/2);
  drawWheel();
  ctx.restore();
}

// --------------- reveal ----------------
function reveal(index){
  const choice = data.choices[index];
  if(!choice) { console.error('Choix introuvable', index); return; }

  resultImage.src = choice.image;
  resultImage.alt = choice.text;
  resultText.textContent = choice.text;
  resultEmoji.textContent = choice.emoji || '';

  // drinks
  drinksList.innerHTML = '';
  addDrink('Pinte de Mango', choice.drinks.pinte || 0);
  addDrink('Jagger Bomb', choice.drinks.jagger || 0);
  addDrink('Whisky', choice.drinks.whisky || 0);

  const total = (choice.drinks.pinte||0) + (choice.drinks.jagger||0) + (choice.drinks.whisky||0);
  paonLevel.textContent = `Mood: ${paonLevelLabel(total)} (${total} verres bus)`;
  moodText.textContent = moodTextForTotal(total);

  resultCard.classList.remove('hidden');
  resultChime();

  // small animation to highlight image
  resultImage.animate([{ transform:'scale(.98)', opacity:0.92},{ transform:'scale(1)', opacity:1 }], { duration:380, easing:'ease-out' });
}

function addDrink(name, count){
  const d = document.createElement('div');
  d.className = 'drink-item';
  d.innerHTML = `<div>${name}</div><div>${count} ${count>1?'verres':'verre'}</div>`;
  drinksList.appendChild(d);
}

function paonLevelLabel(total){
  if(total<=0) return 'Calme';
  if(total<=12) return 'Éveillé';
  if(total<=24) return 'Chaud';
  return 'PAON FOU';
}
function moodTextForTotal(total){
  if(total<=0) return "Soirée sage, pyjama, Netflix.";
  if(total<=12) return "Petit swing, Didier sourit et danse sur la table (dans sa tête).";
  if(total<=24) return "Ça chauffe — le paon se réveille et claque des plumes.";
  return "PAON FOU : Vince et El Predator applaudissent, prudence !";
}

// --------------- initialize ----------------
fetchData().then(init).catch(e=>{ console.error(e); init(null); });
