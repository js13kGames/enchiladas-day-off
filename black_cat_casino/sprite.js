class Frame {
  static map = new Map();
  /**
   *
   * @param {string[]} ids
   * @returns
   */
  static byIds(ids) {
    return ids.map((x) => Frame.map.get(x.includes(".") ? x : x + ".base"));
  }

  static import(f = window.frames) {
    for (let i = 0; i < f.length; i += 9) {
      const n = new Frame(f[i], f[i + 1], f[i + 2], f[i + 3], f[i + 4], f[i + 5], f[i + 6], f[i + 7], f[i + 8]);
      const frames = Frame.map.get(n.sid) || [];
      frames[n.frame] = n;
      Frame.map.set(n.sid, frames);
    }
  }

  constructor(tag, name, frame, atlasX, atlasY, width, height, spriteX, spriteY) {
    this.sid = `${name}.${tag}`;
    this.name = name;
    this.tag = tag;
    this.frame = frame;
    this.u = atlasX;
    this.v = atlasY;
    this.w = width;
    this.h = height;
    this.x = spriteX;
    this.y = spriteY;
  }

  get quad() {
    const f = this;
    return [f.x, f.y, f.w, f.h, f.u, f.v, f.w, f.h];
  }
}

Frame.import();
console.log(Frame.map);

function lerp(a, b, t = 0.5, e = 1, d = b - a) {
  if (d < e) return b;
  return a + t * (b - a);
}

function lerpi(a, b, t = 0.5, e = 1, d = b - a) {
  if (d < e) return b;
  return a + Math.floor(t * (b - a));
}

class Go {
  static root = [];
  x = 0;
  y = 0;
  sx = 1;
  sy = 1;
  r = 0;
  index = 0;
  v = 1;
  l = 0; // lerping
  ld = 0;
  le = 0;
  lms = 0;
  lx = 0;
  ly = 0;
  tx = 0;
  ty = 0;
  e = 0;
  lcb = null;

  lerp(ms, e, tx = this.x, ty = this.y, cb) {
    this.l = true;
    this.tx = tx;
    this.ty = ty;
    this.e = e;
    this.lms = ms;
    this.lcb = cb;
  }

  /** @type {Frame[]} */
  frames = [];
  /** @type {Go[]} */
  children = [];

  constructor(frameIds = [], position = [0, 0]) {
    this.frames = Frame.byIds(frameIds);
    this.children = [];
    this.x = position[0];
    this.y = position[1];
  }

  render(fc, ts) {
    const { x, y, r, sx, sy, v, frames, index, children, target, l, lms, tx, ty, e } = this;
    if (l) {
      if (lms) {
        this.ld = lms;
        this.le = ts + lms;
        this.lms = 0;
        this.lx = 0;
        this.ly = 0;
      }
      const ld = 1 - clamp(this.le - ts, 0, this.ld) / this.ld;

      if (x != tx) {
        this.x = lerp(this.lx, tx, ld, e);
      }

      if (y != ty) {
        this.y = lerp(this.ly, ty, ld, e);
      }

      if (y == ty && x == tx) {
        this.l = 0;
        this.ld = 0;
        this.lms = 0;
        this.le = 0;
        this.lx = 0;
        this.ly = 0;
        this.lcb?.();
        this.lcb = null;
      }
    }

    render.push();
    render.translate(Math.round(x), Math.round(y));
    render.rotate(r);
    render.scale(sx, sy);

    if (v) {
      for (const frame of frames) {
        render.quad(...frame[index].quad);
      }

      for (const go of children) {
        go.render(fc, ts);
      }
    }

    render.pop();
  }
}

class Ago extends Go {
  constructor(layers = [], anims = []) {
    super([]);
    this.frameSets = Object.fromEntries(
      anims.map((anim) => [anim, Frame.byIds(layers.map((layer) => `${layer}.${anim}`))])
    );
    this.frames = this.frameSets.base;
    this.length = 1;
    this.animate = this.animate.bind(this);
  }

  frameTime = 100;
  timestamp = 0;
  playing = false;
  timeoutId = 0;

  play(anim, time = 100) {
    const animFrameSet = this.frameSets[anim];
    if (!animFrameSet) return;
    this.frames = animFrameSet;
    this.length = animFrameSet.length;
    if (this.playing) return;
    this.playing = true;
    this.animate();
  }

  animate() {
    if (this.playing) {
      this.index = (this.index + 1) % this.length; // Nora's kickflip
      this.timeoutId = setTimeout(this.animate, this.frameTime);
    } else {
      this.index = 0;
    }
  }

  stop() {
    this.playing = false;
    this.index = 0;
    this.frame = this.frameSets.base;
    this.length = 0;
    clearTimeout(this.timeoutId);
  }
}

const world = new Go();
Go.root = [world];

const lil_guy = new Go(["lil_guy"]);
const earring = new Go(["earring"]);
const bowtie_tail = new Go(["bowtie_tail"]);
const collar = new Go(["collar"]);
const beeg_headphones = new Go(["beeg_headphones"]);
const bowtie_head = new Go(["bowtie_head"]);
const handle_stache = new Go(["handle_stache"]);
const pencil_stache = new Go(["pencil_stache"]);
const fork = new Go(["fork"]);
const spatula = new Go(["spatula"]);
const visor = new Go(["visor"]);
const sunglasses = new Go(["sunglasses"]);
const business_tie = new Go(["business_tie"]);
const bowtie_neck = new Go(["bowtie_neck"]);
const eepy = new Go(["eepy"]);
const angy = new Go(["angy"]);

const cat = new Ago(["base", "eyes", "feet"], ["base", "walk", "blink"]);
cat.children = [
  lil_guy,
  earring,
  bowtie_tail,
  collar,
  beeg_headphones,
  bowtie_head,
  handle_stache,
  pencil_stache,
  fork,
  spatula,
  visor,
  sunglasses,
  business_tie,
  bowtie_neck,
  eepy,
  angy,
];
cat.children.map((g) => (g.v = 0));
// angy.visible = 1;
cat.v = 1;

const rooms = new Go();
world.children = [rooms, cat];

const bathroom = new Go(["room", "box"], [-65, 0]);
const poop_1 = new Go(["poop_1"]);
const poop_2 = new Go(["poop_2"]);
const poop_3 = new Go(["poop_3"]);
bathroom.children = [poop_1, poop_2, poop_3];

const pic = new Go(["pic"]);
const center = new Go(["room", "carpet"]);
const bowl = new Go(["bowl"]);

const food_1 = new Go(["food_1"]);
food_1.v = 0;
const food_2 = new Go(["food_2"]);
food_2.v = 0;
const food_3 = new Go(["food_3"]);
food_3.v = 0;

bowl.children = [food_1, food_2, food_3];
center.children = [pic, bowl];

const backroom = new Go(["room"], [65, 0]);
rooms.children = [bathroom, center, backroom];

window["world"] = world;
