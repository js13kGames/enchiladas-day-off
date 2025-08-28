import { m3 } from "./m3.js";

/** @type {HTMLCanvasElement} */
const canvas = document.querySelector("#c");
/**@type {WebGL2RenderingContext} */
const gl = canvas.getContext("webgl2");

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

/** @type {HTMLImageElement} */
const cat = window["cat"];

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
in vec2 a_position;
in vec2 a_textureCoord;

in vec3 a_m1;
in vec3 a_m2;

m = mat3(a_m1, a_m2, vec3(0, 0, 1))

in mat3 u_matrix;

uniform vec2 u_resolution;
uniform mat3 u_matrix;

// all out of vertext == varying?
out vec2 v_textureCoord;

void main() {
  gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
  v_textureCoord = a_textureCoord;
}
`
  ),
  createShader(
    gl.FRAGMENT_SHADER,
    `#version 300 es
precision highp float;
uniform sampler2D u_image;
in vec2 v_textureCoord;
out vec4 outColor;

void main() {
  outColor = texture(u_image, v_textureCoord);
  // outColor = texture(u_image, v_textureCoord).bgra;
}
`
  )
);

const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
const textureCoordAttributeLocation = gl.getAttribLocation(program, "a_textureCoord");
const matrixUniformLocation = gl.getUniformLocation(program, "u_matrix");
const imageUniformLocation = gl.getUniformLocation(program, "u_image");

const vao = gl.createVertexArray();
gl.bindVertexArray(vao);

const positionBuffer = gl.createBuffer();

// enable attribute at shader attribute index
// enable is "tell shader to read from memory
gl.enableVertexAttribArray(positionAttributeLocation);

// hey you are this type (ARRAY_BUFFER vs ELEMENT_ARRAY_BUFFER)
// also assign bound buffer to global variable
// ARRAY_BUFFER is BEEG ASS ARRAY
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

const size = 2; // component per iteration
const type = gl.FLOAT; // 32 bit float
const normalize = false; // ??
const stride = 0; // move forward size * sizeof(type)
const offset = 0; // start at the beninging

// binds current global variable buffer to the attribute location
// and defines how to read from buffer
gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

const textureCoordBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
// prettier-ignore
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0,
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0,
  ]),
  gl.STATIC_DRAW
);
gl.enableVertexAttribArray(textureCoordAttributeLocation);

gl.vertexAttribPointer(textureCoordAttributeLocation, size, type, normalize, stride, offset);

const texture = gl.createTexture();

gl.activeTexture(gl.TEXTURE0 + 0);

gl.bindTexture(gl.TEXTURE_2D, texture);

gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

const mipLevel = 0; // the largest mip
const internalFormat = gl.RGBA;
const srcFormat = gl.RGBA;
const srcType = gl.UNSIGNED_BYTE;
gl.texImage2D(gl.TEXTURE_2D, mipLevel, internalFormat, srcFormat, srcType, cat);

let positions = new Float32Array(24);
// let width = cat.width;
// let height = cat.height;
// let translation = [0, 0];
let degrees = 0;
// let radians = (degrees * Math.PI) / 180;
// let rotation = [Math.sin(radians), Math.cos(radians)];
// let scale = [1.2, 1.2];

// let rotation = [0, -1]; // upside down
// let rotation = [1, 0]; // CCW 90
// let rotation = [-1, 0]; // CW 90

function draw() {
  // tell WebGL how to convert from clip space
  gl.viewport(0, 0, c.width, c.height);

  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.useProgram(program);
  gl.bindVertexArray(vao);

  const projectionMatrix = m3.Projection(c.width, c.height);
  const translationMatrix = m3.Translate(50, 50);
  const rotationMatrix = m3.Rotation((degrees * Math.PI) / 180);
  // console.log(`d: ${degrees}, c: ${Math.cos((degrees * Math.PI) / 180)}, s: ${Math.sin((degrees * Math.PI) / 180)}`);
  const scaleMatrix = m3.Scale(1, 1);
  const originTranslation = m3.Translate(-cat.width / 2, -cat.height / 2);

  const transformationMatrix = m3.Identity();
  transformationMatrix.multiply(projectionMatrix);
  transformationMatrix.multiply(translationMatrix);
  transformationMatrix.multiply(rotationMatrix);
  transformationMatrix.multiply(scaleMatrix);
  transformationMatrix.multiply(originTranslation);

  // ask what transpose do?
  gl.uniformMatrix3fv(matrixUniformLocation, false, transformationMatrix);

  // assign texture unit 0 to image uniform location?
  gl.uniform1i(imageUniformLocation, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  positions = new Float32Array(24);

  setRectangle(0, 0, 0, 96, 46);
  // setRectangle(1, -50, 0, 50, 50);

  // setRectangle(0, -100, 0, 96, 46);
  // setRectangle(1, -100, 50, 50, 50);
  // vec2 rotatedPosition = vec2(
  // a_position.x * u_rotation.y + a_position.y * u_rotation.x,
  // a_position.y * u_rotation.y - a_position.x * u_rotation.x);

  let x = positions[0];
  let y = positions[1];

  const m = m3.Identity();
  // console.log("m\n", m.toString());
  // console.log(m.position(0, 0));
  // console.log(m.position(0, 2));
  // console.log(m.position(2, 0));

  // console.log(translationMatrix.toString());
  // m.multiply(translationMatrix);
  // console.log("m*t\n", m.toString());
  // console.log(m.position(0, 0));
  // console.log(m.position(0, 2));
  // console.log(m.position(2, 0));

  m.multiply(rotationMatrix);
  // console.log("m*t*r\n", m.toString());

  // console.log(m.position(0, 0));
  // console.log(m.position(0, 2));
  // console.log(m.position(2, 0));

  // m.multiply(m3.Translate(-1, -1));
  // console.log("m*t*r*o\n", m.toString());

  // console.log(m.position(0, 0));
  // console.log(m.position(0, 2));
  // console.log(m.position(2, 0));

  // console.log(rotationMatrix.toString());
  // console.log(transformationMatrix.toString());

  // let rx = rotation[0];
  // let ry = rotation[1];

  // let r1 = x * ry;
  // let r2 = y * rx;
  // let r3 = y * ry;
  // let r4 = x * rx;

  // console.log(`r: ${rx}, ${ry}`);
  // console.log(`${r1} + ${r2}, ${r3} - ${r4}`);
  // console.log(`${r1 + r2}, ${r3 - r4}`);

  // setRectangle(1, -10, 10, 50, 50);
  // setRectangle(10, 10, 50, 20);

  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
  gl.drawArrays(gl.TRIANGLES, 0, 12);
}

draw();

let active = false;
proto.addEventListener("click", (e) => {
  e.preventDefault();
  // translation[0]++;
  // translation[1]++;
  // active != active;
  loop();

  // degrees += 90;
  // if (degrees >= 360) {
  //   degrees = 0;
  // }
  // draw();
});

function loop() {
  // if (!active) return;
  // set rotation
  degrees--;
  if (degrees >= 360) {
    degrees = 0;
  }

  if (degrees < 0) {
    degrees = 359;
  }
  draw();
  requestAnimationFrame(loop);
}

// for (let i = 0; i < 20; ++i) {
//   setRectangle();
//   gl.uniform4f(
//     colorUniformLocation,
//     Math.random(),
//     Math.random(),
//     Math.random(),
//     1
//   );
//   gl.drawArrays(gl.TRIANGLES, 0, 6);
// }

function setRectangle(i = 0, x = randomInt(65), y = randomInt(65), w = randomInt(65), h = randomInt(65)) {
  console.log(x, y, w, h);
  const x1 = x;
  const x2 = x + w;
  const y1 = y;
  const y2 = y + h;

  positions[i * 12 + 0] = x1;
  positions[i * 12 + 1] = y1;
  positions[i * 12 + 2] = x2;
  positions[i * 12 + 3] = y1;
  positions[i * 12 + 4] = x1;
  positions[i * 12 + 5] = y2;
  positions[i * 12 + 6] = x1;
  positions[i * 12 + 7] = y2;
  positions[i * 12 + 8] = x2;
  positions[i * 12 + 9] = y1;
  positions[i * 12 + 10] = x2;
  positions[i * 12 + 11] = y2;

  // // write to buffer
  // gl.bufferData(
  //   gl.ARRAY_BUFFER,
  //   new Float32Array([
  //     x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]),
  //   gl.DYNAMIC_DRAW
  // );
}

// buffersubdata

/**
 *
 * a_pos 150, 100
 * u_rotation: -1, 0
 *
 * 0 + -100
 * 0 - -150
 *
 * rotatedPos: -100, 150
 *
 */
