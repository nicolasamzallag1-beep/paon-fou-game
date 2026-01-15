/* app.js - version robuste : définit functions globales (enterGame, restartGame, spinGame, nextResult)
   et attache des listeners après chargement. DPI-aware canvas. */

(function(){
  // DOM ready actions (safer even if deferred)
  const onReady = () => {
    // DOM refs
    const home = document.getElementById('home');
    const game = document.getElementById('game');
    const enterBtn = document.getElementById('enterBtn');
    const restartBtn = document.getElementById('restartBtn');
    const wheelCanvas = document.getElementById('wheel');
    const spinBtn = document.getElementById('spinBtn');
    const resultSection = document.getElementById('resultSection');
    const resultImage = document.getElementById('resultImage');
    const resultText = document.getElementById('resultText');
    const resultEmoji = document.getElementById('resultEmoji');
    const drinksList = document.getElementById('drinksList');
    const paonLevel = document.getElementById('paonLevel');
    const nextBtn = document.getElementById('nextBtn');
    const moodText = document.getElementById('moodText') || { textContent: '' };

    let gameData = null;
    let wheelAngle = 0;
    let isSpinning = false;

    // Audio tiny helper
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    function playTone(freq, type='sine', dur=0.08, vol=0.08){
      try {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = type; o.frequency.setValueAtTime(freq, audioCtx.currentTime);
        g.gain.setValueAtTime(vol, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
        o.connect(g); g.connect(audioCtx.destination);
        o.start(); o.stop(audioCtx.currentTime + dur);
      } catch(e){ console.warn('Audio error', e); }
    }
    function playClick(){ playTone(820 + Math.random()*360, 'triangle', 0.05, 0.05); }
    function playResult(){ playTone(420,'square',0.18,0.12); setTimeout(()=>playTone(620,'sawtooth',0.16,0.09),220); }

    // expose robust global functions (override fallback)
    window.enterGame = function(){
      if(audioCtx.state === 'suspended') audioCtx.resume();
      if (home && game) {
        home.classList.add('hidden');
        game.classList.remove('hidden');
        setTimeout(()=> { if(spinBtn) spinBtn.focus(); }, 120);
      }
      playTone(460,'sine',0.12,0.08);
    };
    window.restartGame = function(){ location.reload(); };
    window.nextResult = function(){
      if(resultSection) resultSection.classList.add('hidden');
      if(moodText) moodText.textContent = 'Didier est prêt pour une nouvelle aventure...';
    };
    window.spinGame = function(){ // calls internal startSpin
      if (!gameData || !Array.isArray(gameData.choices) || gameData.choices.length===0) {
        // user feedback
        if (spinBtn) spinBtn.animate([{ transform:'translateY(0)' }, { transform:'translateY(-6px)' }, { transform:'translateY(0)' }], { duration: 300 });
        console.warn('gameData not loaded yet');
        return;
      }
      startSpin();
    };

    // attach listeners (in case inline didn't fire)
    if (enterBtn) enterBtn.addEventListener('click', window.enterGame);
    if (restartBtn) restartBtn.addEventListener('click', window.restartGame);
    if (spinBtn) spinBtn.addEventListener('click', window.spinGame);
    if (nextBtn) nextBtn.addEventListener('click', window.nextResult);

    // fetch data
    async function fetchGameData(){
      try {
        const res = await fetch('gameData.json');
        if(!res.ok) throw new Error('status ' + res.status);
        return await res.json();
      } catch(e){ console.warn('Cannot load gameData.json', e); return null; }
    }

    // DPI-aware canvas sizing
    const ctx = wheelCanvas.getContext('2d');
    function resizeCanvas(){
      const dpr = window.devicePixelRatio || 1;
      const rect = wheelCanvas.getBoundingClientRect();
      wheelCanvas.width = Math.max(200, Math.floor(rect.width * dpr));
      wheelCanvas.height = Math.max(200, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr,0,0,dpr,0,0);
      if (gameData && gameData.choices) drawWheel();
    }
    window.addEventListener('resize', resizeCanvas);

    // draw wheel with emojis
    function drawWheel(){
      const choices = gameData.choices || [];
      const n = Math.max(1, choices.length);
      const cw = wheelCanvas.width;
      const ch = wheelCanvas.height;
      const cx = cw / (window.devicePixelRatio || 1) / 2;
      const cy = ch / (window.devicePixelRatio || 1) / 2;
      const r = Math.min(cx, cy) - 8;
      const sector = (Math.PI*2)/n;

      ctx.clearRect(0,0,cw,ch);
      // shadow
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx+4, cy+6, r+8, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fill();
      ctx.restore();

      for(let i=0;i<n;i++){
        const start = i*sector - Math.PI/2;
        const end = start + sector;
        ctx.beginPath(); ctx.moveTo(cx,cy);
        ctx.arc(cx,cy,r,start,end); ctx.closePath();
        ctx.fillStyle = i%2===0 ? '#2b1c5e' : '#3b2a78';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.stroke();

        const mid = start + sector/2;
        const emoji = choices[i].emoji || '❓';
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(mid);
        ctx.font = `${Math.round(r*0.18)}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#f6f0ff';
        ctx.fillText(emoji, r*0.6, 0);
        ctx.restore();
      }

      ctx.beginPath(); ctx.arc(cx,cy,48,0,Math.PI*2); ctx.fillStyle = '#0b0713'; ctx.fill();
      ctx.fillStyle = '#9db7ff'; ctx.font = '700 12px Helvetica, Arial, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Le destin de Didier', cx, cy+4);
    }

    // rotation rendering
    function renderRotation(angle){
      const dpr = window.devicePixelRatio || 1;
      const w = wheelCanvas.width/dpr, h = wheelCanvas.height/dpr;
      ctx.clearRect(0,0,wheelCanvas.width,wheelCanvas.height);
      ctx.save();
      ctx.translate(w/2, h/2);
      ctx.rotate(angle);
      ctx.translate(-w/2, -h/2);
      drawWheel();
      ctx.restore();
    }

    // spin logic
    function startSpin(){
      if (isSpinning) return;
      if (!gameData || !Array.isArray(gameData.choices) || gameData.choices.length===0) return;
      isSpinning = true;
      const n = gameData.choices.length;
      const sector = (Math.PI*2)/n;
      const targetIndex = Math.floor(Math.random()*n);
      const rotations = 9 + Math.floor(Math.random()*6);
      const offset = (Math.random()*sector*0.8) - sector*0.4;
      const final = rotations*Math.PI*2 + targetIndex*sector + sector/2 + offset;

      const start = performance.now();
      const duration = 3200 + Math.floor(Math.random()*900);
      const initial = wheelAngle;
      const target = wheelAngle + final;
      playSpinSound(duration);

      function frame(now){
        const t = Math.min(1, (now - start)/duration);
        const ease = 1 - Math.pow(1 - t, 3);
        wheelAngle = initial + (target - initial)*ease;
        renderRotation(wheelAngle);
        if (t < 1) requestAnimationFrame(frame);
        else {
          isSpinning = false;
          const normalized = (wheelAngle % (Math.PI*2) + Math.PI*2) % (Math.PI*2);
          const idx = Math.floor(((normalized + Math.PI/2)/sector)) % n;
          const selected = (n - idx) % n;
          revealResult(selected);
        }
      }
      requestAnimationFrame(frame);
    }
    function playSpinSound(duration){
      const count = Math.max(6, Math.floor(duration/140));
      for(let i=0;i<count;i++) setTimeout(()=> playClick(), i*130);
    }

    // reveal result
    function revealResult(index){
      const choice = (gameData.choices && gameData.choices[index]) || null;
      if(!choice) { console.error('Choice not found', index); return; }
      playResult();

      const total = (choice.drinks?.pinte||0) + (choice.drinks?.jagger||0) + (choice.drinks?.whisky||0);

      resultImage.src = choice.image || '';
      resultImage.alt = choice.text || '';
      resultText.textContent = choice.text || '';
      resultEmoji.textContent = choice.emoji || '';

      drinksList.innerHTML = '';
      addDrink('Pinte de Mango', choice.drinks?.pinte || 0);
      addDrink('Jagger Bomb', choice.drinks?.jagger || 0);
      addDrink('Whisky', choice.drinks?.whisky || 0);

      paonLevel.textContent = `Mood: ${paonLevelText(total)} (${total} verres bus)`;
      moodText.textContent = moodDescription(total);

      resultSection.classList.remove('hidden');
      try { resultImage.animate([{ transform:'scale(.92)', filter:'drop-shadow(0 0 0 #a07aff)' }, { transform:'scale(1)', filter:'drop-shadow(0 0 22px #a07aff)'}], { duration: 520, easing:'ease-out' }); } catch(e){}
    }

    function addDrink(name, count){
      const el = document.createElement('div'); el.className='drink-item';
      el.innerHTML = `<div>${name}</div><div>${count} ${count>1?'verres':'verre'}</div>`;
      drinksList.appendChild(el);
    }
    function paonLevelText(total){ if (total<=0) return 'Calme'; if(total<=12) return 'Éveillé'; if(total<=24) return 'Chaud'; return 'PAON FOU !!!'; }
    function moodDescription(total){ if(total<=0) return 'Didier est calme et sérieux, prêt pour une soirée tranquille.'; if(total<=12) return 'Didier commence à sentir le groove.'; if(total<=24) return 'Le paon se réveille, la soirée s'anime.'; return 'PAON FOU : prépare la caméra... ou pas.'; }

    // load data & kick off
    fetchGameData().then((d)=>{
      gameData = d || { choices: [] };
      resizeCanvas();
      setTimeout(()=> renderRotation(wheelAngle), 80);
    });

    // small safety: ensure spin button focusable
    try { if (spinBtn) spinBtn.tabIndex = 0; } catch(e){}
  }; // onReady

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(onReady, 10);
  } else {
    document.addEventListener('DOMContentLoaded', onReady);
  }
})();
