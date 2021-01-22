const { parseCell } = require("@observablehq/parser");
const { Runtime } = require("@observablehq/runtime");
const blessed = require("blessed");
const runtime = new Runtime();
const Fun = Object.getPrototypeOf(async function () {}).constructor;
const GFun = Object.getPrototypeOf(async function* () {}).constructor;
const mod = runtime.module();

let values = new Map();
let states = new Map();
let srces = new Map();
let vars = new Map();

const f = function f(name, val) {
  let src = val
    .toString()
    .replace(/^(async)?\s?\(\) =>/, "")
    .replace(/^(async)?\s?function\*?\s\(\)\s*/, "")
    .trim();

  const cell = parseCell(src);
  src = src.trim().replace(/^{/, "").replace(/}$/, "");
  const inputs = cell.references.map((ref) => ref.name);
  if (srces.get(name) === src) {
    return;
  } else {
    srces.set(name, src);
  }
  if (val.toString().match(/^\(\)/) && !val.toString().match(/}$/)) {
    src = `return ${src}`;
  }
  const fn = cell.async ? new GFun(inputs, src) : new Fun(inputs, src);
  let v = vars.has(name)
    ? vars.get(name)
    : mod.variable({
        pending() {
          states.set(name, "pending");
          update();
        },
        fulfilled(value) {
          values.set(name, JSON.stringify(value));
          states.set(name, "fulfilled");
          update();
        },
        rejected(value) {
          values.set(name, JSON.stringify(value));
          states.set(name, "rejected");
          update();
        },
      });

  v = v.define(name, inputs, fn);
  vars.set(name, v);
};

var screen = blessed.screen({
  smartCSR: true,
});

screen.title = "fn";

// Create a box perfectly centered horizontally and vertically.
var table = blessed.listtable({
  top: "center",
  left: "center",
  width: "100%",
  height: "100%",
  align: "left",
});

screen.append(table);

function update() {
  let data = [["CELL", "STATE", "VALUE"]];
  for (let [name, value] of values) {
    data.push([name, states.get(name), value]);
  }
  table.setData(data);
  screen.render();
}

const target = process.argv[2];

(async () => {
  while (true) {
    const m = require(target);
    delete require.cache[require.resolve(target)];
    m(f);
    await new Promise((r) => setTimeout(r, 100));
  }
})();
