document.addEventListener('DOMContentLoaded', () => {
  const wheel = document.getElementById('wheel');
  const ctx = wheel.getContext('2d');
  let gameData = null;
  let currentAngle = 0;

  // Couleurs Paon pour la roue
  const colors = ['#005f73', '#0a9396', '#94d2bd', '#e9d8a6', '#ee9b00', '#ca6702', '#bb3e03', '#ae2012'];

  async function init() {
    const res = await fetch('gameData.json');
    gameData = await res.json();
    drawWheel();
  }

  function drawWheel() {
    const dpr = window.devicePixelRatio || 1;
    wheel.width = 340 * dpr; wheel.height = 340 * dpr;
    ctx.scale(dpr, dpr);
    const n = gameData.choices.length;
    const arc = (Math.PI * 2) / n;

    gameData.choices.forEach((c, i) => {
      ctx.beginPath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.moveTo(170, 170);
      ctx.arc(170, 170, 160, i * arc, (i + 1) * arc);
      ctx.fill();
      
      ctx.save();
      ctx.translate(170, 170);
      ctx.rotate(i * arc + arc / 2);
      ctx.fillStyle = "#fff";
      ctx.font = "24px serif";
      ctx.fillText(c.emoji, 120, 10);
      ctx.restore();
    });
  }

  function spin() {
    const n = gameData.choices.length;
    const targetIdx = Math.floor(Math.random() * n);
    const duration = 3000;
    const extraSpins = 10 * Math.PI * 2;
    const finalAngle = extraSpins + ( (n - targetIdx) * (Math.PI * 2 / n) );

    const start = performance.now();
    function animate(now) {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 4);
      currentAngle = finalAngle * ease;
      wheel.style.transform = `rotate(${currentAngle}rad)`;
      if (t < 1) requestAnimationFrame(animate);
      else showResult(targetIdx);
    }
    requestAnimationFrame(animate);
  }

  function getMood(total) {
    if (total === 0) return "Didier est d'une sagesse suspecte. Le Paon dort, mais l'œil reste ouvert...";
    if (total < 30) return "Le Paon déploie ses plumes. Didier commence à raconter des blagues.";
    if (total < 60) return "ARA ARA ! Didier est en lévitation. Il a confondu le barman avec un arbitre de rugby.";
    return "PAON FOU TOTAL ! Didier est devenu une légende urbaine. El Predator demande un autographe.";
  }

  function showResult(idx) {
    const c = gameData.choices[idx];
    document.getElementById('resultImage').src = c.image;
    document.getElementById('resultText').innerText = c.text;
    document.getElementById('drinkP').innerText = c.drinks.p;
    document.getElementById('drinkJ').innerText = c.drinks.j;
    document.getElementById('drinkW').innerText = c.drinks.w;
    document.getElementById('paonMood').innerText = getMood(c.drinks.p + c.drinks.j + c.drinks.w);
    document.getElementById('resultPanel').classList.add('show');
  }

  document.getElementById('enterBtn').onclick = () => {
    document.getElementById('home').classList.add('hidden');
    document.getElementById('game').classList.remove('hidden');
    init();
  };
  document.getElementById('spinBtn').onclick = spin;
  document.getElementById('closeResult').onclick = () => document.getElementById('resultPanel').classList.remove('show');
  document.getElementById('backBtn').onclick = () => location.reload();
});
