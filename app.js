const state = {
    data: null,
    isSpinning: false
};

// Sons synthétiques
const audio = new (window.AudioContext || window.webkitAudioContext)();
function playBeep(f, d) {
    try {
        const o = audio.createOscillator();
        const g = audio.createGain();
        o.connect(g); g.connect(audio.destination);
        o.frequency.value = f; g.gain.value = 0.1;
        o.start(); g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + d);
        o.stop(audio.currentTime + d);
    } catch(e) {}
}

async function loadGame() {
    try {
        const res = await fetch('gameData.json');
        state.data = await res.json();
        drawWheel();
    } catch (e) {
        console.error("Erreur chargement JSON");
    }
}

function drawWheel() {
    const canvas = document.getElementById('wheelCanvas');
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 300 * dpr; canvas.height = 300 * dpr;
    ctx.scale(dpr, dpr);

    const n = state.data.choices.length;
    const arc = (Math.PI * 2) / n;

    state.data.choices.forEach((c, i) => {
        ctx.beginPath();
        ctx.fillStyle = i % 2 === 0 ? "#2b1c5e" : "#3b2a78";
        ctx.moveTo(150, 150);
        ctx.arc(150, 150, 145, i * arc, (i + 1) * arc);
        ctx.fill();
        
        ctx.save();
        ctx.translate(150, 150);
        ctx.rotate(i * arc + arc / 2);
        ctx.fillStyle = "white";
        ctx.font = "24px serif";
        ctx.fillText(c.emoji, 90, 8);
        ctx.restore();
    });
}

function startSpin() {
    if (state.isSpinning) return;
    state.isSpinning = true;
    if (audio.state === 'suspended') audio.resume();

    const canvas = document.getElementById('wheelCanvas');
    const n = state.data.choices.length;
    const randIndex = Math.floor(Math.random() * n);
    const duration = 4000;
    const start = performance.now();
    
    // Calcul de la rotation pour tomber sur le bon index
    const totalRotation = (Math.PI * 2 * 8) + ( (n - randIndex - 1) * (Math.PI * 2 / n) ) + (Math.PI / n);

    function animate(now) {
        const elapsed = now - start;
        const t = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - t, 4); // Ease out fort
        const currentAngle = totalRotation * ease;
        canvas.style.transform = `rotate(${currentAngle}rad)`;
        
        if (t < 1) {
            requestAnimationFrame(animate);
        } else {
            state.isSpinning = false;
            showResult(randIndex);
        }
    }
    requestAnimationFrame(animate);
}

function showResult(idx) {
    const c = state.data.choices[idx];
    playBeep(523, 0.5);
    
    document.getElementById('resImg').src = c.image;
    document.getElementById('resTitle').innerText = c.text;
    document.getElementById('resEmoji').innerText = c.emoji;
    document.getElementById('countP').innerText = c.p;
    document.getElementById('countJ').innerText = c.j;
    document.getElementById('countW').innerText = c.w;
    
    const total = c.p + c.j + c.w;
    let mood = "Calme";
    if (total > 40) mood = "PAON FOU !!!";
    else if (total > 15) mood = "Chaud";
    document.getElementById('moodLabel').innerText = "Mood: " + mood;
    
    // Afficher l'overlay
    document.getElementById('resultOverlay').classList.add('active-result');
}

// Événements
document.getElementById('enterBtn').onclick = () => {
    document.getElementById('home').classList.add('hidden');
    document.getElementById('game').classList.remove('hidden');
    document.getElementById('game').classList.add('active');
};

document.getElementById('backBtn').onclick = () => location.reload();
document.getElementById('spinBtn').onclick = startSpin;

// Fermer le résultat
document.getElementById('closeRes').onclick = () => {
    document.getElementById('resultOverlay').classList.remove('active-result');
};

loadGame();
