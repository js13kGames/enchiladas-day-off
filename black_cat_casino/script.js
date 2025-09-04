const ᕦò_óˇᕤ = "ಠ_ಠ";
const ΣδΔ = "sdΔ";
const min = Math.min;
const max = Math.max;

const clamp = (x, mn = VMIN, mx = VMAX) => max(mn, min(mx, x));
const roll = (name, x, r = Math.random() * 100) => {
  console.log(`roll to ${name} ${r > x ? "⭕" : "❌"}`, x, r);
  return r > x;
};
const onclick = (e, f) => e.addEventListener("click", f);
const e = (name, ...args) => {
  console.log(`>> ${name}: `, ...args);
};

/** @type {HTMLCanvasElement} */
const c = document.querySelector("#c");
/**@type {WebGL2RenderingContext} */
const gl = c.getContext("webgl2");
/** @type {HTMLImageElement} */
const cat = window["cat"];

const CAT_STATE = {
  IDLE: 0,
  EAT: 1,
  POOP: 2,
  SLEEP: 3,
  PLAY: 4,
};

const VMIN = 0;
const VMAX = 100;
const TICK_DURATION = 500 * 5;
const IDLE_INCOME_RATE = 1;
const IDLE_HUNGER_RATE = 1;
const IDLE_STAMINA_RATE = -1;
const TUMMY_HURT = 4;

var cat_state = 0,
  gyros = 0, // money
  gyrosRate = 0,
  oreos = 0, // hunger
  oreosRate = 0,
  litter = 0, // poop
  litterRate = 0,
  stamina = 100,
  staminaRate = -1,
  happiness = 50, // anger
  happinessRate = 0,
  food = 0,
  toys = 0,
  full = 0,
  last_state = CAT_STATE.IDLE,
  state_counter = 0,
  paused = false,
  mite = 0,
  tickTimestamp = 0,
  renderTimestamp = 0;

const items = {
  bowtie_neck: [10],
  business_tie: [10],
  sunglasses: [10],
};

function load() {
  onclick(next, (e) => {
    if (e.ctrlKey) {
      update();
      update();
      update();
      update();
      update();
    } else {
      update();
    }
  });
  onclick(pause, () => {
    paused = !paused;
    if (!paused) start();
  });
  onclick(stuff, () => {
    food = clamp(food + 25);
  });
  onclick(clean, () => {
    litter = 0;
  });
  onclick(play, () => {
    if (roll("play", 50)) {
      cat_state = CAT_STATE.PLAY;
    }
  });
}

function start() {
  paused = false;
  requestAnimationFrame(render);
}

function update() {
  mite++;

  if (last_state != cat_state) {
    last_state = cat_state;
    state_counter = 1;
  }

  const no_food = food == 0;
  const any_food = food > 0;
  const tired = stamina < 10;
  const rested = stamina > 80;
  const min_frame = state_counter > 3;

  // determine state transitions
  switch (cat_state) {
    case CAT_STATE.EAT:
      if (no_food || roll("eat", 50)) {
        cat_state = CAT_STATE.IDLE;
        break;
      }

    case CAT_STATE.POOP:
      if (!full) {
        cat_state = CAT_STATE.IDLE;
        break;
      }

    case CAT_STATE.IDLE:
      if (min_frame && roll("poop", 100 - full * 10)) {
        cat_state = CAT_STATE.POOP;
        break;
      }

      if (min_frame && any_food && oreos && roll("eat", 50)) {
        if (full >= TUMMY_HURT) cat_state = CAT_STATE.POOP;
        else cat_state = CAT_STATE.EAT;
        break;
      }

      if ((min_frame && tired) || roll("sleep", 25)) {
        cat_state = CAT_STATE.SLEEP;
        break;
      }

    case CAT_STATE.PLAY:
      if (min_frame && roll("bored", 75)) {
        cat_state = CAT_STATE.IDLE;
        break;
      }

    case CAT_STATE.SLEEP:
      if (min_frame && roll("wake", rested ? 50 : 78)) {
        cat_state = CAT_STATE.IDLE;
        break;
      }
  }

  if (last_state == cat_state) state_counter++;
  else {
    last_state = cat_state;
    state_counter = 1;
  }

  // execute state tasks
  switch (cat_state) {
    case CAT_STATE.IDLE:
      gyrosRate = IDLE_INCOME_RATE;
      oreosRate = IDLE_HUNGER_RATE;
      staminaRate = IDLE_STAMINA_RATE;
      if (happiness < 50 || oreos > 75) {
        happinessRate = 1;
      }
      break;

    case CAT_STATE.PLAY:
      happinessRate = -5;
      oreosRate = 2;
      staminaRate = 2;
      break;

    case CAT_STATE.SLEEP:
      staminaRate = 5;
      oreosRate = IDLE_HUNGER_RATE;
      happinessRate = -5;
      break;

    case CAT_STATE.EAT:
      food = clamp(food - 25);
      full = clamp(full + 1, 0, 4);
      oreos = clamp(oreos - 25);
      staminaRate = -5;
      if (oreos < 75) {
        happinessRate = -5;
      }
      break;

    case CAT_STATE.PLAYING:
      gyrosRate = 2;
      staminaRate = -5;
      happinessRate = -5;
      break;
  }

  if (litter > 75) {
    happinessRate += 5;
  }

  stamina = clamp(stamina + staminaRate);
  gyros = clamp(gyros + gyrosRate);
  oreos = clamp(oreos + oreosRate);
  happiness = clamp(happiness + happinessRate);
  gyros = clamp(gyros + gyrosRate);
}

function render(timestamp) {
  const λ = timestamp - renderTimestamp;
  if (paused) return;
  if (timestamp - tickTimestamp >= TICK_DURATION) {
    tickTimestamp = timestamp;
    update();
  }
  draw();
  requestAnimationFrame(render);
}

function draw() {
  cat_label.textContent = `${[...Object.keys(CAT_STATE)][cat_state]} ${mite} ${full ? `💩${full}` : ""} `;
  d_label.textContent = `${[...Object.keys(CAT_STATE)][last_state]}: ${state_counter}`;
  money_label.textContent = `🧶: ${gyros}`;
  stamina_label.textContent = `⚡: ${stamina}`;
  stamina_bar.value = stamina;
  hunger_label.textContent = `🍴: ${oreos}`;
  hunger_bar.value = oreos;
  poop_label.textContent = `🗑️: ${litter}`;
  poop_bar.value = litter;
  anger_label.textContent = `😠: ${happiness}`;
  anger_bar.value = happiness;
  food_label.textContent = `🍗: ${food}`;
}

load();
start();
