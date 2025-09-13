const ᕦò_óˇᕤ = "ಠ_ಠ";
const ΣδΔ = "sdΔ";
var æ = 'textContent';
const δ = undefined;

c.rect = c.getBoundingClientRect.bind(c);
const el = (t, id, text) => {
  const e = document.createElement(t);
  e.id = id;
  e.innerText = text;
  return e;
};
const clamp = (x, mn = VMIN, mx = VMAX) => max(mn, min(mx, x));
const roll = (name, x, r = random() * 100) => {
  console.log(`roll to ${name} ${r > x ? "⭕" : "❌"}`, x, r);
  return r > x;
};
const onclick = (e, f) => (e.addEventListener("click", (v) => !d && f(v)), e);

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
// const TICK_DURATION = 500;
const TICK_DURATION = 500 * 5;
const IDLE_INCOME_RATE = 1;
const IDLE_HUNGER_RATE = 1;
const IDLE_STAMINA_RATE = -1;
const TUMMY_HURT = 3;

var cat_state = 0,
  mony = 100, // money
  monyRate = 1,
  hungry = 0, // hunger
  hungryRate = 0,
  litter = 1, // poop
  litterRate = 0,
  stamina = 100,
  staminaRate = -1,
  anger = 50, // anger
  angerRate = 0,
  food = 0,
  toys = 0,
  full = 0,
  //mini
  g = 0,

  cards = [],
  s = 0,
  d = 0,
  r = 1,
  last_state = CAT_STATE.IDLE,
  state_counter = 0,
  paused = false,
  mite = 0,
  frame = 0,
  lts = 0,
  renderTimestamp = 0;

function load() {
  items.forEach(i => {
    var [n, p, o] = i;
    li.appendChild(
      onclick(el("button", n, `${n}: $${p}`), ({target: t}) => {
        if (i[2]) {
          att[n].v = !att[n].v;
          t.textContent = `${n} ${att[n].v?'✅':''}`;
        } else {
          if (mony >= p) {
            mony = mony - p;
            i[2] = 1;
            cat.emote('hapy', 500);
            t.textContent = `${n}`;
          }
        }
      })
    );
  });

  onclick(b_l, () => {
    if (r != 0) rooms.change(0);
    else {
      litter = 0;
      cat.emote('hapy', 500);
    }
  });

  onclick(b_f, () => {
    if (r!=1) rooms.change(1);
    else {
      if (mony >= 25 && food < 3) {
        mony = mony - 25;
        food = clamp(food + 1, 0, 3);
        cat.emote('hapy', 500);
      }
    }
  });

  onclick(b_s, () => {
    s = !s;
    sh.style.display = s ? "block" : "none";
  });

  onclick(b_c, () => {
    if (r == 2) (b.shuf(), g = 1);
    else {
      g = 0;
      rooms.change(2);
    }
  });
  
  onclick(c, (e, t=e.target) => {
    if (r == 2 && g == 1) {
      var { width, height } = c.rect();
      const px = round((e.offsetX / width)*w);
      const py = round((e.offsetY / height)*h);
      const ci = b.click(px,py)??-1;
      if (ci>=0) b.flip(ci);
    }
  });
}

function minigame_start() {
  b.children.map((c, i) => c.set(cr[b.p[i]]));
}

function start() {
  paused = false;
  render.bkg(75, 105, 47);
  requestAnimationFrame(draw);
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
  const starved = hungry > 90;
  const mad = anger > 95;
  const min_frame = state_counter > 3;

  // determine state transitions
  switch (cat_state) {
    case CAT_STATE.EAT:
      if (no_food || roll("stop eat", 50)) {
        cat_state = CAT_STATE.IDLE;
        break;
      }

    case CAT_STATE.POOP:
      if (!full) {
        cat_state = CAT_STATE.IDLE;
        break;
      }

    case CAT_STATE.IDLE:
      if (min_frame && roll("poop", 99-(full*33))) {
        cat_state = CAT_STATE.POOP;
        rooms.change(0);
        break;
      }

      if (min_frame && any_food && hungry && roll("eat", 50)) {
        if (full >= TUMMY_HURT) {
          cat_state = CAT_STATE.POOP;
          rooms.change(0);
        }
        else {
          cat_state = CAT_STATE.EAT;
          rooms.change(1);
        }
        break;
      }

      if (!(mad||starved) && min_frame && (tired || roll("sleep", g==1?50:25))) {
        cat_state = CAT_STATE.SLEEP;
        break;
      }

    // case CAT_STATE.PLAY:
    //   if (min_frame && roll("bored", 75)) {
    //     cat_state = CAT_STATE.IDLE;
    //     break;
    //   }

    case CAT_STATE.SLEEP:
      if (min_frame && roll("wake", rested || g!=1 ? 50 : 78)) {
        cat_state = CAT_STATE.IDLE;
        break;
      }
  }

  if (last_state == cat_state) state_counter++;
  else {
    last_state = cat_state;
    state_counter = 1;
  }

  att.eepy.v = 0;
  // set state base rates
  switch (cat_state) {
    case CAT_STATE.IDLE:
      monyRate = IDLE_INCOME_RATE;
      hungryRate = IDLE_HUNGER_RATE;
      staminaRate = -2;
      if (anger < 50 || hungry > 75) {
        angerRate = 1;
      }
      break;

    case CAT_STATE.POOP:
      full = 0;
      litter = clamp(litter + 1, 0, 3);
      break;

    case CAT_STATE.SLEEP:
      att.eepy.v = 1;
      staminaRate = 3;
      hungryRate = 3;
      angerRate = -1;
      break;

    case CAT_STATE.EAT:
      food = clamp(food - 1, 0, 3);
      full = clamp(full + 1, 0, 3);
      hungry = clamp(hungry - 40);
      cat.emote('hapy')
      staminaRate = -5;
      if (hungry < 75) {
        angerRate = -5;
      }
      break;

    // case CAT_STATE.PLAYING:
    //   monyRate = 2;
    //   staminaRate = -5;
    //   angerRate = -5;
    //   break;
  }

  // add conditional modifiers
  if (hungry > 25) {
    angerRate += 1;
  }

  if (hungry > 50) {
    staminaRate -= 4;
    angerRate += 1;
  }

  if (hungry > 80) {
    // staminaRate -= 3;
    angerRate += 1;
  }

  if (litter > 3) {
    angerRate += 3;
  }
  
  const acc = cat.attc();
  angerRate -= clamp(acc-1, 0, 3);

  if (anger > 90) {
    staminaRate -= 5;
  }


  // execute
  stamina = clamp(stamina + staminaRate);
  mony = clamp(mony + monyRate);
  hungry = clamp(hungry + hungryRate);
  anger = clamp(anger + angerRate);
  mony = clamp(mony + monyRate);

  if (anger > 90) {
    emotes.map(e => e.v = 0);
    att.angy.v = 1;
  }
}

function draw(ts) {
  if (paused) return;
  frame++;
  if (ts - lts >= TICK_DURATION) {
    lts = ts;
    update();
  }
  dui();
  dgfx(frame, ts);
  requestAnimationFrame(draw);
}

const fv = v =>`${v}`.padStart(2,'0');
function dui() {
  _a.textContent = `${[...Object.keys(CAT_STATE)][cat_state]} ${mite} ${full ? `💩${full}` : ""} `;
  food_1.v = food >= 1;
  food_2.v = food >= 2;
  food_3.v = food >= 3;
  poop_1.v = litter >= 1;
  poop_2.v = litter >= 2;
  poop_3.v = litter >= 3;
  l_m.textContent = `${mony}🪙`;
  l_s.textContent = `⚡${fv(stamina)}`;
  l_h.textContent = `🍴${fv(hungry)}`;
  l_a.textContent = `😊${fv(50 - anger)}`;
  b_l.textContent = r == 0 ? "Clean":"Litter";
  b_f.textContent = r == 1 ? "Feed $25":"Center";
  b_c.textContent = r == 2 ? (g == 0 ? 'Play':'Pick'):'Cards';
}

function dgfx(frame, ts) {
  render.clear();
  world.render(frame, ts);
  render.flush();
}

load();
start();
