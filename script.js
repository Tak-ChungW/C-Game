let state = {
  sanity: 100,
  health: 100,
  stress: 0,
  time: 0,
  inventory: [],
  systems: {
    security: false,
    cameras: false,
    power: false
  }
};

let currentScene = "start";
let entitySeen = 0;

/* ---------------- UTILITY ---------------- */

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/* ---------------- TIME + PHASE ---------------- */

function getPhase() {
  if (state.time < 120) return "early";
  if (state.time < 240) return "mid";
  return "late";
}

function advanceTime(amount = 10) {
  state.time += amount;

  state.sanity -= 0.5;
  state.stress += 0.5;
}

function applyPhaseEffects() {
  const phase = getPhase();

  if (phase === "mid") {
    state.stress += 2;
    state.sanity -= 1;
  }

  if (phase === "late") {
    state.stress += 3;
    state.sanity -= 2;
  }
}

/* ---------------- SYSTEMS (PUZZLES) ---------------- */

function applySystemEffects() {
  if (!state.systems.cameras) {
    state.stress += 2;
    state.sanity -= 1;
  }

  if (!state.systems.power) {
    state.sanity -= 2;
    spawnHallucination();
  }

  if (!state.systems.security) {
    state.stress += 1;
  }
}

/* ---------------- HALLUCINATIONS ---------------- */

function spawnHallucination() {
  let intensity =
    (100 - state.sanity) +
    state.stress +
    (state.systems.power ? 0 : 20);

  if (Math.random() < intensity / 250) {
    const list = [
      "A customer appears in the reflection only.",
      "The store layout shifts slightly.",
      "You hear breathing through the speakers.",
      "A face appears in the freezer glass."
    ];

    const text = list[Math.floor(Math.random() * list.length)];

    const p = document.createElement("p");
    p.innerText = "HALLUCINATION: " + text;
    p.style.color = "red";

    document.getElementById("story").appendChild(p);

    state.sanity -= 5;
  }
}

/* ---------------- ATMOSPHERE ---------------- */

const events = [
  "The lights flicker in a slow rhythm.",
  "The freezer hum sounds like words.",
  "A customer appears but never enters.",
  "The cameras are already watching you."
];

function triggerEvent() {
  if (Math.random() < 0.4) {
    const e = events[Math.floor(Math.random() * events.length)];

    const p = document.createElement("p");
    p.innerText = "ATMOSPHERE: " + e;
    p.style.color = "orange";

    document.getElementById("story").appendChild(p);

    state.stress += 3;
  }
}

/* ---------------- ENTITY ---------------- */

function updateEntity() {
  if (state.time > 60 && Math.random() < 0.3) {
    entitySeen++;

    const lines = [
      "A customer is outside, watching.",
      "The same customer appears again closer.",
      "You recognize them but shouldn't.",
      "They are inside now."
    ];

    const p = document.createElement("p");
    p.innerText = "ENTITY: " + lines[Math.floor(Math.random() * lines.length)];
    p.style.color = "purple";

    document.getElementById("story").appendChild(p);

    state.sanity -= 8;
  }
}

/* ---------------- LOOP ---------------- */

function gameLoop() {
  advanceTime(10);
  applyPhaseEffects();
  applySystemEffects();

  if (Math.random() < 0.4) triggerEvent();
  if (Math.random() < 0.3) spawnHallucination();
  if (Math.random() < 0.25) updateEntity();

  checkEndings();
}

/* ---------------- ENDINGS ---------------- */

function setEnding(text) {
  document.getElementById("story").innerText = text;
  document.getElementById("choices").innerHTML = "";

  const btn = document.createElement("button");
  btn.innerText = "Restart Shift";

  btn.onclick = () => {
    state = {
      sanity: 100,
      health: 100,
      stress: 0,
      time: 0,
      inventory: [],
      systems: { security: false, cameras: false, power: false }
    };
    entitySeen = 0;
    showScene("start");
  };

  document.getElementById("choices").appendChild(btn);
}

function checkEndings() {
  state.sanity = clamp(state.sanity, 0, 100);
  state.health = clamp(state.health, 0, 100);
  state.stress = clamp(state.stress, 0, 100);

  if (state.health <= 0) return setEnding("You collapse before dawn.");
  if (state.sanity <= 0) return setEnding("You lose yourself completely.");
  if (state.time >= 360) return setEnding("Shift complete... but something followed you home.");
}

/* ---------------- STORY ---------------- */

const storyData = {
  start: {
    text: "Your night shift begins. The store is empty.",
    choices: [
      { text: "Go to counter", next: "counter", time: 10 },
      { text: "Check backroom", next: "backroom", time: 15 }
    ]
  },

  counter: {
    text: "You stand behind the counter. The silence feels wrong.",
    choices: [
      { text: "Wait for customer", next: "counter", time: 15 },
      { text: "Check systems", next: "systems", time: 15 }
    ]
  },

  backroom: {
    text: "The backroom hums with unstable power.",
    choices: [
      { text: "Fix power system", next: "counter", fix: "power", time: 15 },
      { text: "Return", next: "counter", time: 10 }
    ]
  },

  systems: {
    text: "Systems flicker and fail.",
    choices: [
      { text: "Fix cameras", next: "counter", fix: "cameras", time: 15 },
      { text: "Fix security", next: "counter", fix: "security", time: 15 }
    ]
  }
};

/* ---------------- UI ---------------- */

function showScene(scene) {
  const data = storyData[scene];

  document.getElementById("story").innerText = data.text;
  const choicesDiv = document.getElementById("choices");
  choicesDiv.innerHTML = "";

  gameLoop();

  data.choices.forEach(choice => {
    const btn = document.createElement("button");

    btn.innerText = choice.text;

    btn.onclick = () => {
      if (choice.sanity) state.sanity += choice.sanity;
      if (choice.health) state.health += choice.health;
      if (choice.stress) state.stress += choice.stress;
      if (choice.item) state.inventory.push(choice.item);
      if (choice.fix) state.systems[choice.fix] = true;

      currentScene = choice.next;

      updateUI();
      showScene(currentScene);
    };

    choicesDiv.appendChild(btn);
  });

  updateUI();
  checkEndings();
}

/* ---------------- UI UPDATE ---------------- */

function updateUI() {
  document.getElementById("sanity").innerText = Math.floor(state.sanity);
  document.getElementById("health").innerText = Math.floor(state.health);
  document.getElementById("stress").innerText = Math.floor(state.stress);
  document.getElementById("time").innerText = state.time;

  document.getElementById("inventory").innerText =
    state.inventory.length ? state.inventory.join(", ") : "None";

  if (state.sanity < 40) {
    document.body.style.transform = "skew(-1deg)";
    document.getElementById("story").style.filter = "blur(1px)";
  } else {
    document.body.style.transform = "none";
    document.getElementById("story").style.filter = "none";
  }
}

/* ---------------- START ---------------- */

showScene(currentScene);