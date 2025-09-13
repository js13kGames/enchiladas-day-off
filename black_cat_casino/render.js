// /** @type {HTMLCanvasElement} */
// const c = document.querySelector("#c");
/**@type {WebGL2RenderingContext} */
const gl = c.getContext("webgl2");
// /** @type {HTMLImageElement} */
// const png = window["png"];

function createShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }

  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
}

function createProgram(vertShader, fragShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertShader);
  gl.attachShader(program, fragShader);
  gl.linkProgram(program);
  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }

  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}

function createBuffer(bufferType, size, usage) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(bufferType, buffer);
  gl.bufferData(bufferType, size, usage);
  return buffer;
}

function createTexture(width, height) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, png);
  (texture.width = width), (texture.height = height);
  return texture;
}

const texture = createTexture(png.width, png.height);

/**
 * random int from 0 to range
 * @param {number} r
 */
function randomInt(r) {
  return Math.floor(Math.random() * r);
}

const program = createProgram(
  createShader(
    gl.VERTEX_SHADER,
    `#version 300 es
in vec2 a_xy;
in vec2 a_uv;
in vec4 a_tint;

out vec2 v_uv;
out vec4 v_tint;

uniform mat4 u_mat;

void main() {
  gl_Position = vec4(u_mat * vec4(a_xy, 1.0, 1.0)); // remove .0 test
  v_uv = a_uv;
  v_tint = a_tint;
}
`
  ),
  createShader(
    gl.FRAGMENT_SHADER,
    `#version 300 es
precision highp float;
in vec2 v_uv;
in vec4 v_tint;

uniform sampler2D u_image;
out vec4 outColor;

void main() {
  // gl_FragColor = texture2D(u_image, v_uv) * v_tint;
  outColor = texture(u_image, v_uv);
  // new texture function is not argb
}
`
  )
);

// x, y, u, v, rgba
const VERTEX_SIZE = 4 * 2 + 4 * 2 + 4;
const MAX_BATCH = 10922; // floor((2 ^ 16) / 6)
const MAX_STACK = 100;
const MAT_SIZE = 6;
const VERTS_PER_QUAD = 6;
const MAT_STACK_SIZE = MAX_STACK * MAT_SIZE;
const VERTS_DATA_SIZE = VERTEX_SIZE * MAX_BATCH * 4;
const INDEX_DATA_SIZE = MAX_BATCH * (2 * VERTS_PER_QUAD);
const width = c.width;
const height = c.height;

// stores positions, uv, tint
const vertexData = new ArrayBuffer(VERTS_DATA_SIZE);
const vertexPositionData = new Float32Array(vertexData);
const vertexColorData = new Uint32Array(vertexData);
const vertexIndexData = new Uint16Array(INDEX_DATA_SIZE);
const IndexBufferObject = createBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexData.byteLength, gl.STATIC_DRAW);
const VertexBufferObject = createBuffer(gl.ARRAY_BUFFER, vertexData.byteLength, gl.DYNAMIC_DRAW);

let count = 0; // verticies

// prettier-ignore
let mat = new Float32Array([
  1, 0,
  0, 1,
  0, 0,
]);
let stack = new Float32Array(100);
let stackPointer = 0;
const cos = Math.cos;
const sin = Math.sin;

gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
gl.enable(gl.BLEND);

gl.useProgram(program);
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, IndexBufferObject);
const MAX_VERTS = MAX_BATCH * VERTS_PER_QUAD;
for (let i = (j = 0); i < MAX_VERTS; i += VERTS_PER_QUAD, j += 4) {
  vertexIndexData[i + 0] = j;
  vertexIndexData[i + 1] = j + 1;
  vertexIndexData[i + 2] = j + 2;
  vertexIndexData[i + 3] = j;
  vertexIndexData[i + 4] = j + 3;
  vertexIndexData[i + 5] = j + 1;
}

gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, vertexIndexData);
gl.bindBuffer(gl.ARRAY_BUFFER, VertexBufferObject);

const positionAttributeLocation = gl.getAttribLocation(program, "a_xy");
const textureAtttributeLocation = gl.getAttribLocation(program, "a_uv");
const tintAttributeLocation = gl.getAttribLocation(program, "a_tint");
const matrixUniformLocation = gl.getUniformLocation(program, "u_mat");

gl.enableVertexAttribArray(positionAttributeLocation);
gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, 0, VERTEX_SIZE, 0);

gl.enableVertexAttribArray(textureAtttributeLocation);
gl.vertexAttribPointer(textureAtttributeLocation, 2, gl.FLOAT, 0, VERTEX_SIZE, 8);

gl.enableVertexAttribArray(tintAttributeLocation);
gl.vertexAttribPointer(tintAttributeLocation, 4, gl.UNSIGNED_BYTE, 1, VERTEX_SIZE, 16);

const rx = 2 / width;
const ry = -2 / height;

// prettier-ignore
gl.uniformMatrix4fv(matrixUniformLocation, 0, 
  new Float32Array([
    rx, 0,  0, 0,
    0, ry,  0, 0,
    0,  0,  1, 1,
    -1, 1,  0, 0
  ])
)

gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, texture);

const render = {
  gl,
  c,
  color: 0xffffffff, //white (argb)

  /**
   * @param {number} r float?
   * @param {number} g float?
   * @param {number} b float?
   */
  background(r, g, b) {
    gl.clearColor(r / 255, g / 255, b / 255, 1);
  },

  clear() {
    gl.clear(gl.COLOR_BUFFER_BIT);
  },

  // prettier-ignore
  translate(x, y) {
    // const nx = (mat[0] * x) + (mat[2] * y) + mat[4];
    // const ny = (mat[1] * x) + (mat[3] * y) + mat[5];

    // mat = new Float32Array([
    //   mat[0], mat[1],
    //   mat[2], mat[3],
    //   nx,     ny
    // ]);

    mat[4] = (mat[0] * x) + (mat[2] * y) + mat[4];
    mat[5] = (mat[1] * x) + (mat[3] * y) + mat[5];
  },

  scale(x, y) {
    mat[0] *= x;
    mat[1] *= x;
    mat[2] *= y;
    mat[3] *= y;
  },

  rotate(r) {
    const a = mat[0];
    const b = mat[1];
    const c = mat[2];
    const d = mat[3];
    const sr = sin(r);
    const cr = cos(r);

    mat[0] = a * cr + c * sr;
    mat[1] = b * cr + d * sr;
    mat[2] = a * -sr + c * cr;
    mat[3] = b * -sr + d * cr;
  },

  push() {
    stack[stackPointer + 0] = mat[0];
    stack[stackPointer + 1] = mat[1];
    stack[stackPointer + 2] = mat[2];
    stack[stackPointer + 3] = mat[3];
    stack[stackPointer + 4] = mat[4];
    stack[stackPointer + 5] = mat[5];
    stackPointer += 6;
  },

  pop() {
    stackPointer -= 6;
    mat[0] = stack[stackPointer + 0];
    mat[1] = stack[stackPointer + 1];
    mat[2] = stack[stackPointer + 2];
    mat[3] = stack[stackPointer + 3];
    mat[4] = stack[stackPointer + 4];
    mat[5] = stack[stackPointer + 5];
  },

  quad(x, y, w, h, u, v, uw = w, uh = h) {
    const x0 = x; // top left
    const y0 = y;
    const x1 = x + w; // bottom right
    const y1 = y + h;
    const x2 = x; // bottom left
    const y2 = y + h;
    const x3 = x + w; // top right
    const y3 = y;

    const u0 = u / texture.width; // top left
    const v0 = v / texture.height;
    const u1 = (u + uw) / texture.width; // bottom right
    const v1 = (v + uh) / texture.height;

    const [a, b, c, d, e, f] = mat;
    const argb = render.color;
    let offset = 0;

    if (count + 1 >= MAX_BATCH) {
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertexData);
      gl.drawElements(gl.TRIANGLES, count * VERTS_PER_QUAD, gl.UNSIGNED_SHORT, 0);
      count = 0;
    }

    offset = count * VERTEX_SIZE;
    // Vertex Order XY|UV|ARGB
    // Vertex 1
    vertexPositionData[offset++] = x0 * a + y0 * c + e;
    vertexPositionData[offset++] = x0 * b + y0 * d + f;
    vertexPositionData[offset++] = u0;
    vertexPositionData[offset++] = v0;
    vertexPositionData[offset++] = 0xffffffff;

    vertexPositionData[offset++] = x1 * a + y1 * c + e;
    vertexPositionData[offset++] = x1 * b + y1 * d + f;
    vertexPositionData[offset++] = u1;
    vertexPositionData[offset++] = v1;
    vertexPositionData[offset++] = 0xffffffff;

    vertexPositionData[offset++] = x2 * a + y2 * c + e;
    vertexPositionData[offset++] = x2 * b + y2 * d + f;
    vertexPositionData[offset++] = u0;
    vertexPositionData[offset++] = v1;
    vertexPositionData[offset++] = 0xffffffff;

    vertexPositionData[offset++] = x3 * a + y3 * c + e;
    vertexPositionData[offset++] = x3 * b + y3 * d + f;
    vertexPositionData[offset++] = u1;
    vertexPositionData[offset++] = v0;
    vertexPositionData[offset++] = 0xffffffff;

    if (++count >= MAX_BATCH) {
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertexData);
      gl.drawElements(gl.TRIANGLES, count * VERTS_PER_QUAD, gl.UNSIGNED_SHORT, 0);
      count = 0;
    }
  },

  flush() {
    if (count == 0) return;
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertexPositionData.subarray(0, count * VERTEX_SIZE));
    gl.drawElements(gl.TRIANGLES, count * VERTS_PER_QUAD, gl.UNSIGNED_SHORT, 0);
    count = 0;
  },
};

window["render"] = render;
