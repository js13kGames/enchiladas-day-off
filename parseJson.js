const data = require("./black_cat_casino/cat.json");

let parsed = `window['f'] = `;
const frameData = [];

for (let i = 0; i < data.frames.length; i++) {
  const filename = data.frames[i].filename.split("|");
  const name = filename[0];
  const tag = filename[1];
  const frame = parseInt(filename[2], 10);
  const atlas = data.frames[i].frame;
  const sprite = data.frames[i].spriteSourceSize;
  if (atlas.w != sprite.w || atlas.h != sprite.h) {
    console.log(">>", name, "has mismatched sizes");
  }

  frameData.push(tag, name, frame, atlas.x, atlas.y, atlas.w, atlas.h, sprite.x, sprite.y);
}

parsed += JSON.stringify(frameData);

const fs = require("fs");
fs.writeFileSync("./black_cat_casino/data.js", parsed, { encoding: "utf-8" });
