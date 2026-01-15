const gameData = {
  title: "Ara Ara, Excusez Moi !",
  coverImage: "paoncover.PNG",
  startTime: "18:00",
  initialPrompt: "Que fait le paon fou ce soir ?",
  initialImages: ["paon9.PNG", "paon10.PNG"],
  choices: [
    { id: 1, text: "Rentrer chez lui se reposer", image: "paon1.PNG" },
    { id: 2, text: "Rentrer pour geeker toute la nuit", image: "paon7.PNG" },
    { id: 3, text: "Réunion au Cavendish", image: "paon5.PNG" },
    { id: 4, text: "Faire la fête avec Vince", image: "paon11.PNG" },
    { id: 5, text: "Soirée tranquille sans alcool", image: "paon3.PNG" },
    { id: 6, text: "Soirée de fou", image: "paon6.PNG" },
    { id: 7, text: "After chez Manon", image: "paon1.PNG" },
    { id: 8, text: "Se finir avec El Predator", image: "paon4.PNG" },
  ],
  drinks: ["Pinte de Mango", "Jagger Bomb", "Whisky"],
};

const promptEl = document.getElementById("prompt");
const imageContainer = document.getElementById("image-container");
const choicesContainer = document.getElementById("choices");

function clearChoices() {
  choicesContainer.innerHTML = "";
}

function showInitialImages() {
  imageContainer.innerHTML = "";
  gameData.initialImages.forEach((img) => {
    const imageEl = document.createElement("img");
    imageEl.src = img;
    imageEl.alt = "Paon image";
    imageEl.classList.add("card-image");
    imageContainer.appendChild(imageEl);
  });
}

function showChoices() {
  clearChoices();
  imageContainer.innerHTML = ""; // Hide initial images when showing choices
  gameData.choices.forEach((choice) => {
    const btn = document.createElement("button");
    btn.classList.add("choice-btn");
    btn.textContent = choice.text;
    btn.onclick = () => selectChoice(choice);
    choicesContainer.appendChild(btn);
  });
}

function selectChoice(choice) {
  clearChoices();
  promptEl.textContent = choice.text;
  imageContainer.innerHTML = "";
  const img = document.createElement("img");
  img.src = choice.image;
  img.alt = choice.text;
  img.classList.add("choice-image");
  imageContainer.appendChild(img);
}

function startGame() {
  promptEl.textContent = gameData.initialPrompt;
  showInitialImages();
  setTimeout(() => {
    showChoices();
  }, 2000);
}

startGame();
