// app.js - copie complète
document.addEventListener('DOMContentLoaded', () => {
  // --- audio context global (créé dès le premier clic) ---
  let audioCtx = null;
  function ensureAudio(){
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  function playTone(freq = 440, type='sine', duration=0.12, vol=0.08){
    const ctx = ensureAudio();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + duration);
  }
  function playSpinSound(){
    // quick arpeggio during spin start
    let i=0, id = setInterval(()=>{
      playTone(380 + i*30, 'sawtooth', 0.06, 0.05);
      i++; if(i>8) clearInterval(id);
    },45);
  }
  function playResultSound(){
    playTone(700,'sine',0.14,0.08);
    setTimeout(()=>playTone(520,'sine',0.24,0.08),140);
  }

  // --- DOM elements ---
  const home = document.getElementById('home');
  const intro = document.getElementById('intro');
  const introImage = document.getElementById('introImage');
  const introTitle = document.getElementById('introTitle');
  const introCard = document.getElementById('introCard');
  const enterBtn = document.getElementById('enterBtn');
  const game = document.getElementById('game');
  const spinBtn = document.getElementById('spinBtn');
  const rulesToggle = document.getElementById('rulesToggle');
  const rulesBox = document.getElementById('rules');

  const wheel = document.getElementById('wheel');
  const ctx = wheel.getContext('2d');

  const resultPanel = document.getElementById('resultPanel');
  const resultImage = document.getElementById('resultImage');
  const resultText = document.getElementById('resultText');
  const resultEmoji = document.getElementById('resultEmoji');
  const drinkP = document.getElementById('drinkP');
  const drinkJ = document.getElementById('drinkJ');
  const drinkW = document.getElementById('drinkW');
  const paonMood = document.getElementById('paonMood');
  const closeResult = document.getElementById('closeResult');

  // --- game state ---
  let gameData = null;
  let spinning = false;
  let currentAngle = 0;

  // --- helper : animate intro title letters (wrap chars in spans + staggered delay) ---
  (function animateIntroTitle(){
    const el = introTitle;
    const text = el.textContent.trim();
    el.textContent = '';
    for(let i=0;i<text.length;i++){
      const ch = text[i]===' ' ? '\u00A0' : text[i];
      const span = document.createElement('span');
      span.textContent = ch;
      span.style.animationDelay = `${i*40}ms`; // stagger
      el.appendChild(span);
    }
  })();

  // --- data loader (reads gameData.json) ---
  async function loadData(){
    try{
      const res = await fetch('gameData.json');
      gameData = await res.json();
      prepareCanvas();
      drawWheel();
    }catch(e){
      console.error('Erreur load gameData.json', e);
      alert('Impossible de charger gameData.json — vérifie le fichier.');
    }
  }

  // --- canvas adapt for DPR and draw ---
  function prepareCanvas(){
    const dpr = window.devicePixelRatio || 1;
    const size = 340;
    wheel.width = size * dpr;
    wheel.height = size * dpr;
    wheel.style.width = size + 'px';
    wheel.style.height = size + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  function drawWheel(){
    if(!gameData) return;
    const choices = gameData.choices;
    const n = choices.length;
    const arc = (2*Math.PI)/n;
    const radius = 160;
    ctx.clearRect(0,0,wheel.width,wheel.height);
    for(let i=0;i<n;i++){
      ctx.beginPath();
      ctx.fillStyle = i%2===0 ? '#3a1a6a' : '#2a154f';
      ctx.moveTo(radius,radius);
      ctx.arc(radius,radius,radius-8,i*arc,(i+1)*arc);
      ctx.fill();

      // emoji label
      ctx.save();
      ctx.translate(radius,radius);
      ctx.rotate(i*arc + arc/2);
      ctx.fillStyle = '#d6a2e8';
      ctx.font = '28px serif';
      ctx.textAlign = 'center';
      ctx.fillText(choices[i].emoji, (radius-40), 10);
      ctx.restore();
    }
    // center label
    ctx.beginPath(); ctx.arc(radius,radius,36,0,2*Math.PI); ctx.fillStyle='#12092a'; ctx.fill();
    ctx.fillStyle='#a07aff'; ctx.font='bold 12px Arial'; ctx.textAlign='center'; ctx.fillText('Le destin de Didier', radius, radius+4);
  }

  // --- spin animation ---
  function spinWheel(){
    if(spinning || !gameData) return;
    spinning = true;
    spinBtn.disabled = true;
    playSpinSound();

    const n = gameData.choices.length;
    const targetIndex = Math.floor(Math.random()*n);
    const arc = (2*Math.PI)/n;
    const spins = 8 + Math.floor(Math.random()*3);
    const targetAngle = spins*2*Math.PI + (n - targetIndex) * arc - arc/2;
    const duration = 2800;
    const start = performance.now();

    function animate(now){
      const t = Math.min((now-start)/duration,1);
      const ease = 1 - Math.pow(1 - t, 3);
      currentAngle = targetAngle * ease;
      wheel.style.transform = `rotate(${currentAngle}rad)`;
      if(t < 1) requestAnimationFrame(animate);
      else {
        spinning = false;
        spinBtn.disabled = false;
        // show result
        showResult(targetIndex);
      }
    }
    requestAnimationFrame(animate);
  }

  // --- mood thresholds (changez ici si besoin) ---
  function getMood(total){
    if(total === 0) return "Didier est sobre, soirée tranquille.";
    if(total < 4) return "Le paon s'échauffe doucement.";
    if(total < 8) return "Didier commence à s'amuser.";
    if(total < 12) return "Paon fou en action, ça bouge !";
    return "PAON FOU MAXIMUM ! Soirée légendaire.";
  }

  // --- show result (images displayed entirely via object-fit: contain) ---
  function showResult(idx){
    const c = gameData.choices[idx];
    resultImage.src = c.image;
    resultText.textContent = c.text;
    resultEmoji.textContent = c.emoji || '';
    drinkP.textContent = c.drinks.p;
    drinkJ.textContent = c.drinks.j;
    drinkW.textContent = c.drinks.w;
    const total = (c.drinks.p||0) + (c.drinks.j||0) + (c.drinks.w||0);
    // choose per-choice mood if present, else fallback
    paonMood.textContent = c.mood ? c.mood : getMood(total);
    playResultSound();
    resultPanel.classList.add('show');
    resultPanel.setAttribute('aria-hidden','false');
  }

  // --- events ---

  // Enter: go to intro. This click also unlocks audio on many browsers.
  enterBtn.addEventListener('click', () => {
    ensureAudio();
    home.classList.add('hidden');
    intro.classList.remove('hidden');

    // alternate intro images automatically
    let toggle = true;
    introImage.src = 'paon9.PNG';
    const id = setInterval(()=> {
      introImage.src = toggle ? 'paon10.PNG' : 'paon9.PNG';
      toggle = !toggle;
    }, 1800);

    // clicking the intro card starts the game (no "Commencer" button)
    introCard.onclick = () => {
      clearInterval(id);
      intro.classList.add('hidden');
      game.classList.remove('hidden');
      loadData();
    };
  });

  // rules toggle
  rulesToggle.addEventListener('click', () => {
    rulesBox.classList.toggle('hidden');
  });

  // spin
  spinBtn.addEventListener('click', spinWheel);

  // close result
  closeResult.addEventListener('click', () => {
    resultPanel.classList.remove('show');
    resultPanel.setAttribute('aria-hidden','true');
  });

  // handle resize to keep canvas crisp
  window.addEventListener('resize', () => {
    if(gameData) { prepareCanvas(); drawWheel(); }
  });
});
