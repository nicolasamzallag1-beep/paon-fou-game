document.addEventListener('DOMContentLoaded', () => {
  let audioCtx = null;
  function playTone(f, d) {
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.frequency.value = f; g.gain.value = 0.1;
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + d);
  }

  const wheel = document.getElementById('wheel');
  const ctx = wheel.getContext('2d');
  let gameData = null;
  let currentRotation = 0;
  let spinning = false;

  async function loadData() {
    const res = await fetch('gameData.json');
    gameData = await res.json();
    drawWheel();
  }

  function drawWheel() {
    const n = gameData.choices.length;
    const arc = (2 * Math.PI) / n;
    ctx.clearRect(0,0,340,340);
    for(let i=0; i<n; i++) {
      ctx.beginPath();
      ctx.fillStyle = i % 2 === 0 ? '#3a1a6a' : '#2a154f';
      ctx.moveTo(170,170);
      ctx.arc(170,170,160, i*arc, (i+1)*arc);
      ctx.fill();
      ctx.save();
      ctx.translate(170,170);
      ctx.rotate(i*arc + arc/2);
      ctx.fillStyle = '#fff';
      ctx.font = '30px serif';
      ctx.fillText(gameData.choices[i].emoji, 110, 10);
      ctx.restore();
    }
  }

  document.getElementById('spinBtn').onclick = () => {
    if(spinning) return;
    spinning = true;
    playTone(400, 0.1);
    const n = gameData.choices.length;
    const targetIndex = Math.floor(Math.random() * n);
    const arc = (2 * Math.PI) / n;
    
    // Calcul précis pour que la flèche (en haut, à -PI/2) pointe le bon index
    const extraSpins = 5 * 2 * Math.PI;
    const finalRotation = extraSpins + (Math.PI * 1.5) - (targetIndex * arc) - (arc / 2);
    
    const start = performance.now();
    const duration = 3000;

    function animate(now) {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      currentRotation = finalRotation * ease;
      wheel.style.transform = `rotate(${currentRotation}rad)`;
      if(t < 1) requestAnimationFrame(animate);
      else {
        spinning = false;
        playTone(600, 0.2);
        showResult(targetIndex);
      }
    }
    requestAnimationFrame(animate);
  };

  function showResult(idx) {
    const c = gameData.choices[idx];
    document.getElementById('resultImage').src = c.image;
    document.getElementById('resultText').innerText = c.text;
    document.getElementById('resultEmoji').innerText = c.emoji;
    document.getElementById('drinkP').innerText = c.drinks.p;
    document.getElementById('drinkJ').innerText = c.drinks.j;
    document.getElementById('drinkW').innerText = c.drinks.w;
    const total = c.drinks.p + c.drinks.j + c.drinks.w;
    document.getElementById('paonMood').innerText = total > 15 ? "PAON FOU MAXIMUM !" : "Le paon s'échauffe...";
    document.getElementById('resultPanel').classList.add('show');
  }

  document.getElementById('enterBtn').onclick = () => {
    document.getElementById('home').classList.add('hidden');
    document.getElementById('intro').classList.remove('hidden');
  };

  document.getElementById('introCard').onclick = () => {
    document.getElementById('intro').classList.add('hidden');
    document.getElementById('game').classList.remove('hidden');
    loadData();
  };

  document.getElementById('closeResult').onclick = () => document.getElementById('resultPanel').classList.remove('show');
});
