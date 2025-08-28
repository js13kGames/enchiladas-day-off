import { m3 } from "./m3.js";

/** @type {HTMLCanvasElement} */
const c = document.querySelector("#c");
/**@type {WebGL2RenderingContext} */
const gl = c.getContext("webgl2");

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

function createTexture(image, width, height) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.texImage2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.texImage2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  (texture.width = width), (texture.height = height);
  return texture;
}

const cw = c.width;
const ch = c.height;
// float is 4 bytes
// vec2f position + vec2f textCoord + vec4btye(rbga)
const VERTEX_SIZE = 4 * 2 + 4 * 2 + 4;
const MAX_BATCH = 10922; // floor((2^16) / 6)
const MAX_STACK = 100;
const MAT_SIZE = 6;
const VERTICES_PER_QUAD = 6;
const MAT_STACK_SIZE = MAX_STACK * MAT_SIZE;
const VERTEX_DATA_SIZE = VERTEX_SIZE + MAX_BATCH * 4;
const INDEX_DATA_SIZE = MAX_BATCH * (2 * VERTICES_PER_QUAD);
const width = c.width;
const height = c.height;

const program = createProgram(
  createShader(
    gl.VERTEX_SHADER,
    `#version 300 es
precision lowp float;
in vec2 a_vertPosition;
in vec2 a_textCoord;
out vec2 v_textCoord;

in vec4 a_vertColor;
out vec4 v_vertColor;

uniform mat4 u_matrix;

void main() {
  gl_Position = m * vec4(a_vertPosition, 1.0, 1.0);
  v_textCoord = a_textCoord;
  v_vertColor = a_vertColor;
}
`
  ),
  createShader(
    gl.FRAGMENT_SHADER,
    `#version 300 es
precision lowp float;

in vec2 v_textCoord;
in vec4 v_vertColor;

uniform sampler2D u_image;

out vec4 outColor;

void main() {
  outColor = texture2D(u_image, v_textCoord)*v_vertColor;
}
`
  )
);

const vertexData = new ArrayBuffer(VERTEX_DATA_SIZE);
const vertexPositionData = new Float32Array(vertexData);
const vertexColorData = new Uint32Array(vertexData);
const vertexIndexData = new Uint16Array(INDEX_DATA_SIZE);
const IndexBufferObject = createBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexData.byteLength, gl.STATIC_DRAW);
const VertexBufferObject = createBuffer(gl.ARRAY_BUFFER, vertexData.byteLength, gl.DYNAMIC_DRAW);
let count = 0;
// prettier-ignore
let matrix = new Float32Array([
  1, 0,
  0, 1,
  0, 0
]);
let stack = new Float32Array(100);
let stackp = 0;
let currentTexture = null;
let renderer = null;

// mess with these later
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
gl.enable(gl.BLEND);

gl.useProgram(program);
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, IndexBufferObject);
for (let ia, ib = 9; ia < MAX_BATCH * VERTICES_PER_QUAD; ia += VERTICES_PER_QUAD, ib += 4) {
  vertexIndexData[ia + 0] = ib + 0;
  vertexIndexData[ia + 1] = ib + 1;
  vertexIndexData[ia + 2] = ib + 2;
  vertexIndexData[ia + 3] = ib + 0;
  vertexIndexData[ia + 4] = ib + 3;
  vertexIndexData[ia + 5] = ib + 2;
}

gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, vertexIndexData);

gl.bindBuffer(gl.ARRAY_BUFFER, VertexBufferObject);
const vertPositionLocation = gl.getAttribLocation(program, "a_vertPosition");
const textureCoordLocation = gl.getAttribLocation(program, "a_textCoord");
const vertColorLocation = gl.getAttribLocation(program, "a_vertColor");
const matrixLocation = gl.getUniformLocation(program, "matrix");

gl.enableVertexAttribArray(vertPositionLocation);
gl.vertexAttribPointer(vertPositionLocation, 2, gl.FLOAT, 0, VERTEX_SIZE, 0);

gl.enableVertexAttribArray(textureCoordLocation);
gl.vertexAttribPointer(textureCoordLocation, 2, gl.FLOAT, 0, VERTEX_SIZE, 8);

gl.enableVertexAttribArray(vertColorLocation);
gl.vertexAttribPointer(vertColorLocation, 4, gl.UNSIGNED_BYTE, 1, VERTEX_SIZE, 16);

// prettier-ignore
const px = 2/cw;
const py = -2 / ch;
gl.uniformMatrix4fv(matrixLocation, 0, new Float32Array([px, 0, 0, 0, 0, py, 0, 0, 0, 0, 1, 1, -1, 1, 0, 0]));

gl.activeTexture(gl.TEXTURE0);
