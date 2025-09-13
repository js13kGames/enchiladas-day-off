const ᕦò_óˇᕤ = "ಠ_ಠ";
const ΣδΔ = "sdΔ";
const δ = undefined;
const min = Math.min;
const max = Math.max;

const el = (t, id, text) => {
  const e = document.createElement(t);
  e.id = id;
  e.innerText = text;
  return e;
};
const clamp = (x, mn = VMIN, mx = VMAX) => max(mn, min(mx, x));
const roll = (name, x, r = Math.random() * 100) => {
  console.log(`roll to ${name} ${r > x ? "⭕" : "❌"}`, x, r);
  return r > x;
};
const onclick = (e, f) => (e.addEventListener("click", f), e);

// /** @type {HTMLCanvasElement} */
// const c = document.querySelector("#c");
// /**@type {WebGL2RenderingContext} */
// const gl = c.getContext("webgl2");
// /** @type {HTMLImageElement} */
// const cat = window["cat"];

const CAT_STATE = {
  IDLE: 0,
  EAT: 1,
  POOP: 2,
  SLEEP: 3,
  PLAY: 4,
};

const items = [
  ["bowtie_neck", 10, 0],
  ["business_tie", 10, 0],
  ["sunglasses", 10, 0],
  ["visor", 10, 0],
  ["spatula", 10, 0],
  ["fork", 10, 0],
  ["pencil_stache", 10, 0],
  ["handle_stache", 10, 0],
  ["bowtie_head", 10, 0],
  ["beeg_headphones", 10, 0],
  ["collar", 10, 0],
  ["bowtie_tail", 10, 0],
  ["earring", 10, 0],
  ["lil_guy", 10, 0],
];

const VMIN = 0;
const VMAX = 100;
const TICK_DURATION = 500 * 5;
const IDLE_INCOME_RATE = 1;
const IDLE_HUNGER_RATE = 1;
const IDLE_STAMINA_RATE = -1;
const TUMMY_HURT = 4;

var cat_state = 0,
  gyros = 0, // money
  gyrosRate = 1,
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
  shop_open = 0,
  no_butts = 0,
  room = 1,
  last_state = CAT_STATE.IDLE,
  state_counter = 0,
  paused = false,
  mite = 0,
  frame = 0,
  lastTickTimestamp = 0,
  renderTimestamp = 0;

function load() {
  items.forEach((i) => {
    i.push(el("button", i[0], `${i[0]}: $${i[1]}`));
    li.appendChild(
      onclick(i[3], () => {
        if (i[2]) {
          // toggle item
          console.log("toggle");
        } else {
          // check wallet
          console.log("buy");
          if (gyros > i[1]) {
            gyros = gyros - i[1];
            i[2] = 1;
          }
        }
      })
    );
  });

  // onclick(next, (e) => {
  //   if (e.ctrlKey) {
  //     update();
  //     update();
  //     update();
  //     update();
  //     update();
  //   } else {
  //     update();
  //   }
  // });
  // onclick(pause, () => {
  //   paused = !paused;
  //   if (!paused) start();
  // });
  onclick(stuff, () => {
    food = clamp(food + 25);
  });
  onclick(clean, () => {
    if (no_butts) return;
    if (room != 0) {
      no_butts = 1;
      rooms.lerp(1000, 1, 65, δ, () => {
        room = 0;
        no_butts = 0;
      });
    } else {
      litter = 0;
    }
  });
  onclick(play, () => {
    if (roll("play", 50)) {
      cat_state = CAT_STATE.PLAY;
    }
  });
  onclick(shop, () => {
    shop_open = !shop_open;
    sh.style.display = shop_open ? "block" : "none";
  });
}

function start() {
  paused = false;
  render.background(75, 105, 47);
  // render.background(1, 1, 1);

  requestAnimationFrame(render2);
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

  // set state base rates
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
      happinessRate = -1;
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

  // add conditional modifiers
  if (oreos > 25) {
    happinessRate += 1;
  }

  if (oreos > 50) {
    staminaRate -= 4;
    happinessRate += 2;
  }

  if (oreos > 80) {
    // staminaRate -= 3;
    happinessRate += 2;
  }

  if (litter > 75) {
    happinessRate += 5;
  }

  if (happiness > 90) {
    staminaRate -= 5;
  }

  /** notes
   * - [ ] shouldn't be able to sleep while max hungry or angry
   */

  // execute
  stamina = clamp(stamina + staminaRate);
  gyros = clamp(gyros + gyrosRate);
  oreos = clamp(oreos + oreosRate);
  happiness = clamp(happiness + happinessRate);
  gyros = clamp(gyros + gyrosRate);
}

function render2(timestamp) {
  const λ = timestamp - renderTimestamp;
  if (paused) return;
  if (timestamp - lastTickTimestamp >= TICK_DURATION) {
    lastTickTimestamp = timestamp;
    update();
  }
  frame++;
  // console.log(frame);
  draw();
  draw2(frame, timestamp);
  requestAnimationFrame(render2);
}

function draw() {
  // cat_label.textContent = `${[...Object.keys(CAT_STATE)][cat_state]} ${mite} ${full ? `💩${full}` : ""} `;
  // d_label.textContent = `${[...Object.keys(CAT_STATE)][last_state]}: ${state_counter}`;
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

function draw2(frame, ts) {
  render.clear();
  world.render(frame, ts);
  render.flush();
}

load();
start();
