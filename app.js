document.addEventListener('DOMContentLoaded', () => {
    const state = { data: null, spinning: false, angle: 0 };
    const audio = new (window.AudioContext || window.webkitAudioContext)();

    function playSound(f, d, t = 'sine') {
        const o = audio.createOscillator();
        const g = audio.createGain();
        o.type = t; o.frequency.value = f;
        g.gain.setValueAtTime(0.1, audio.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + d);
        o.connect(g); g.connect(audio.destination);
        o.start(); o.stop(audio.currentTime + d);
    }

    async function init() {
        const res = await fetch('gameData.json');
        state.data = await res.json();
        draw();
    }

    function draw() {
        const canvas = document.getElementById('wheel');
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        canvas.width = 320 * dpr; canvas.height = 320 * dpr;
        ctx.scale(dpr, dpr);
        const n = state.data.choices.length;
        const arc = (Math.PI * 2) / n;
        state.data.choices.forEach((c, i) => {
            ctx.beginPath();
            ctx.fillStyle = i % 2 === 0 ? "#2b1c5e" : "#3b2a78";
            ctx.moveTo(160, 160); ctx.arc(160, 160, 155, i * arc, (i + 1) * arc); ctx.fill();
            ctx.save(); ctx.translate(160, 160); ctx.rotate(i * arc + arc / 2);
            ctx.fillStyle = "white"; ctx.font = "20px serif"; ctx.fillText(c.emoji, 110, 8);
            ctx.restore();
        });
    }

    function spin() {
        if (state.spinning) return;
        state.spinning = true;
        if (audio.state === 'suspended') audio.resume();
        const duration = 4000;
        const start = performance.now();
        const n = state.data.choices.length;
        const targetIdx = Math.floor(Math.random() * n);
        const extraRot = (Math.PI * 2) * 10;
        const finalAngle = extraRot + ( (n - targetIdx) * (Math.PI * 2 / n) );

        function animate(now) {
            const t = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - t, 4); // Ease out plus fluide
            state.angle = finalAngle * ease;
            document.getElementById('wheel').style.transform = `rotate(${state.angle}rad)`;
            if (t < 1) requestAnimationFrame(animate);
            else { state.spinning = false; showResult(targetIdx); }
        }
        requestAnimationFrame(animate);
    }

    function getTrashMood(total) {
        if (total === 0) return "Didier est d'une sagesse insultante. Le Lou Rugby est en deuil devant tant de sobriété. On dirait un CPE en plein lundi matin. C'est nul, réveille le paon !";
        if (total < 30) return "Le Paon commence à secouer ses plumes. Didier sourit bêtement et commence à trouver que le Cavendish est le plus bel endroit du monde. On est sur un échauffement correct.";
        if (total < 60) return "ALERTE ARA ARA ! Didier essaie de faire un haka tout seul dans la rue. Il a confondu son badge de CPE avec une carte de fidélité pour des Jagger Bombs. Ça devient très sale.";
        if (total < 100) return "PAON FOU EN ORBITE ! Didier ne parle plus français, il communique uniquement par cris de paon. Il a proposé un After à El Predator et Vince n'arrive plus à le suivre. Légendaire.";
        return "APOCALYPSE PAON ! Didier est devenu une divinité du chaos. Le foie est en PLS, mais l'honneur du Lou Rugby est sauf. Demain sera une journée très, très longue au collège.";
    }

    function showResult(idx) {
        const c = state.data.choices[idx];
        playSound(523.25, 0.6, 'square'); // Son de victoire
        document.getElementById('resultImage').src = c.image;
        document.getElementById('resultText').innerText = c.text;
        document.getElementById('resultEmoji').innerText = c.emoji;
        document.getElementById('drinkP').innerText = c.drinks.p;
        document.getElementById('drinkJ').innerText = c.drinks.j;
        document.getElementById('drinkW').innerText = c.drinks.w;
        
        const total = c.drinks.p + c.drinks.j + c.drinks.w;
        document.getElementById('paonMood').innerText = getTrashMood(total);
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
