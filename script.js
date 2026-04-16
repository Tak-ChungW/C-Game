/* =======================
   STATE
======================= */

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

let entity = {
  seen: 0
};

/* =======================
   UTILITY
======================= */

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/* =======================
   SHIFT PHASE SYSTEM
======================= */

function getPhase() {
  if (state.time < 120) return "early";
  if (state.time < 240) return "mid";
  return "late";
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
    spawnHallucination();
  }
}

/* =======================
   TIME SYSTEM
======================= */

function advanceTime(amount = 10) {
  state.time += amount;

  state.sanity -= 0.5;
  state.stress += 0.5;
}

/* =======================
   SYSTEM EFFECTS (PUZZLES)
======================= */

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

/* =======================
   HALLUCINATIONS
======================= */

function spawnHallucination() {
  let intensity =
    (100 - state.sanity) +
    state.stress +
    (state.systems.power ? 0 : 15);

  if (Math.random() < intensity / 250) {
    const list = [
      "A customer is standing behind you in reflection only.",
      "The store layout shifts slightly when you blink.",
      "You hear breathing inside the speaker system.",
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

/* =======================
   ATMOSPHERIC EVENTS
======================= */

const events = [
  "The lights flicker in a slow pattern.",
  "The freezer hum sounds like speech.",
  "A customer appears, then disappears before entering.",
  "The cameras are already watching you move."
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

/* =======================
   ENTITY SYSTEM
======================= */

function updateEntity() {
  if (state.time > 60 && Math.random() < 0.3) {
    entity.seen++;

    const lines = [
      "A customer is outside. They never leave.",
      "The same customer appears in different clothes.",
      "You recognize them, but you’ve never seen them before.",
      "The reflection does not match the person."
    ];

    const p = document.createElement("p");
    p.innerText = "ENTITY: " + lines[Math.floor(Math.random() * lines.length)];
    p.style.color = "purple";

    document.getElementById("story").appendChild(p);

    state.sanity -= 8;
  }
}

/* =======================
   SYSTEM LOOP
======================= */

function gameLoop() {
  advanceTime(10);
  applyPhaseEffects();
  applySystemEffects();
  triggerEvent();
  updateEntity();
  spawnHallucination();

  checkEndings();
}

/* =======================
   ENDINGS
======================= */

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
    entity.seen = 0;
    showScene("start");
  };

  document.getElementById("choices").appendChild(btn);
}

function checkEndings() {
  state.sanity = clamp(state.sanity, 0, 100);
  state.health = clamp(state.health, 0, 100);
  state.stress = clamp(state.stress, 0, 100);

  if (state.health <= 0) return setEnding("You collapse before dawn. DEAD ENDING.");
  if (state.sanity <= 0) return setEnding("You lose yourself to the night.");
  if (state.time >= 360) return setEnding("Shift complete... but something followed you home.");
}

/* =======================
   STORY
======================= */

const storyData = {
  start: {
    text: "Your shift begins. The gas station is empty and too quiet.",
    choices: [
      { text: "Go to counter", next: "counter", time: 10 },
      { text: "Check backroom", next: "backroom", time: 15 }
    ]
  },

  counter: {
    text: "You stand behind the counter. The silence feels heavy.",
    choices: [
      { text: "Wait for customer", next: "customer", time: 20 },
      { text: "Check systems", next: "systems", time: 15 }
    ]
  },

  backroom: {
    text: "The backroom hums with unstable power.",
    choices: [
      { text: "Fix power system", next: "counter", time: 15, fix: "power" },
      { text: "Return", next: "counter", time: 10 }
    ]
  },

  systems: {
    text: "Control panels flicker. Everything is unstable.",
    choices: [
      { text: "Fix cameras", next: "counter", time: 15, fix: "cameras" },
      { text: "Fix security", next: "counter", time: 15, fix: "security" }
    ]
  },

  customer: {
    text: "A customer enters the store slowly.",
    choices: [
      { text: "Serve customer", next: "counter", time: 10 },
      { text: "Observe them", next: "counter", time: 10 }
    ]
  }
};

/* =======================
   UI LOOP
======================= */

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

/* =======================
   UI
======================= */

function updateUI() {
  document.getElementById("sanity").innerText = state.sanity;
  document.getElementById("health").innerText = state.health;
  document.getElementById("stress").innerText = state.stress;
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

/* =======================
   START
======================= */

showScene(currentScene);