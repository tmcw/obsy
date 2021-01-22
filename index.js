module.exports = (f) => {
  f("a", () => 1);
  f("b", () => a);
  f("c", () => d + 10);
  f("c", () => now);
  f("d", async function* () {
    let x = 0;
    while (true) {
      yield ++x;
      await Promises.delay(200);
    }
  });
  f("s", () => d + now);
};
