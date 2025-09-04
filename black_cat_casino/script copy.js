import { m3 } from "./m3.js";

/** @type {HTMLCanvasElement} */
const canvas = document.querySelector("#c");
/**@type {WebGL2RenderingContext} */
const gl = canvas.getContext("webgl2");
/** @type {HTMLImageElement} */
const cat = window["cat"];

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
