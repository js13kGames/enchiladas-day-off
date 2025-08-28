// ref texture
// vec2 position
// vec2 size
// vec2 uv
// vec2 rotation
// vec2 scale

// prettier-ignore
export class m3 extends Float32Array {
  static Identity() {
    return new m3(
      [
        1, 0, 0, // x column
        0, 1, 0, // y column
        0, 0, 1, // spare column
      ] 
    );
  }
  

  /**
   * Transforms happen in the spare column
   * where the position is stored
   */
  static Translate(tx, ty) {
    return new m3(
      [
        1,  0,  0, // x column (grid) x is the size of the plane?
        0,  1,  0, // y column (grid) y is the size of the plane?
        tx, ty, 1, // spare column (position)
      ]
    );
  }

  // note how the transforms happen in the "grid space" instead
  // of the transfrom space, this is fundamentally transforming
  // the plane's orientation
  static Rotation(radians) {
    const c = Math.cos(radians);
    const s = Math.sin(radians);
    return new m3(
      [
        c, -s, 0, // x column
        s, c,  0, // y column
        0, 0,  1, // z spare column
      ]
    )
  }

  static Scale(sx, sy) {
    return new m3(
      [
        sx, 0,  0, // x column (grid)
        0,  sy, 0, // y column (grid)
        0,  0,  1, // spare column (position)
      ]
    )
  }

  static Projection(w, h) {
    return [
      2/w, 0, 0,
      0, -2/h, 0,
      -1, 1, 1,
    ]
  }

  toString() {
return `${this[0].toFixed(2)}, ${this[1].toFixed(2)}, ${this[2].toFixed(2)},
${this[3].toFixed(2)}, ${this[4].toFixed(2)}, ${this[5].toFixed(2)},
${this[6].toFixed(2)}, ${this[7].toFixed(2)}, ${this[8].toFixed(2)},`
  }

  position(x, y, z = 1) {
    return [
      x * this[0] + y * this[3] + z * this[6],
      x * this[1] + y * this[4] + z * this[7],
      x * this[2] + y * this[5] + z * this[8],
    ]
  }

  copy() {
    return new m3(this);
  }

  multiply(n) {
    const m = this.copy();
    this[0] = m[0] * n[0] + m[3] * n[1] + m[6] * n[2];
    this[1] = m[1] * n[0] + m[4] * n[1] + m[7] * n[2];
    this[2] = m[2] * n[0] + m[5] * n[1] + m[8] * n[2];

    this[3] = m[0] * n[3] + m[3] * n[4] + m[6] * n[5];
    this[4] = m[1] * n[3] + m[4] * n[4] + m[7] * n[5];
    this[5] = m[2] * n[3] + m[5] * n[4] + m[8] * n[5];

    this[6] = m[0] * n[6] + m[3] * n[7] + m[6] * n[8];
    this[7] = m[1] * n[6] + m[4] * n[7] + m[7] * n[8];
    this[8] = m[2] * n[6] + m[5] * n[7] + m[8] * n[8];
    return this;
  }

  multiplyCopy(m) {
    return this.copy().multiply(m);
  }

  translate(tx = 0, ty = 0) {
    const t = m3.Translate(tx, ty)
    this.multiply(t);
    return this;
  }

  rotation(radians) {
    const r = m3.Rotation(radians);
    this.multiply(r);
    return this;
  }

  rotaionDeg(degrees) {
    const r = m3.Rotation((degrees * Math.PI) / 180);
    this.multiply(r);
    return this;
  }

  scale(sx, sy) {
    const s = m3.Scale(sx, sy);
    this.multiply(s);
    return this;
  }
}

// [vx, vy]
// [rx, ry] // point on the unit circle where rotation is
// [0, 1] // normal
// [0.64, 0.77] // 45ish
// [1, 0] // 90 deg rotate

// x = ry * vx + rx * vy
// y = ry * vy + -rx * vx
