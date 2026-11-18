import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const code = await readFile(
  new URL("../src/recognition/matcher.js", import.meta.url),
  "utf8",
);
const { createRecognizer, poseDistance, features, validClasses, classify } =
  await import(
    "data:text/javascript;base64," + Buffer.from(code).toString("base64")
  );
const letter = { name: "A", command: false },
  confirm = { name: "Confirmar", command: true };
test("letter delay, transition, confirmation delay and no duplicates", () => {
  const r = createRecognizer();
  assert.equal(r.step(letter, 0).pending, "");
  r.step(letter, 700);
  assert.equal(r.step(letter, 1400).pending, "A");
  assert.equal(r.step({ name: "B", command: false }, 1700).pending, "A");
  assert.equal(r.step(confirm, 2000).append, undefined);
  r.step(confirm, 2500);
  assert.equal(r.step(confirm, 3000).append, "A");
  for (let t = 3500; t < 7000; t += 500)
    assert.equal(r.step(confirm, t).append, undefined);
  r.step(null, 7000);
  r.step(null, 7800);
  r.step(letter, 8000);
  r.step(letter, 8700);
  assert.equal(r.step(letter, 9400).pending, "A");
  r.step(confirm, 9500);
  r.step(confirm, 10000);
  assert.equal(r.step(confirm, 10500).append, "A");
});
test("unstable poses and long gaps cannot complete a hold", () => {
  const r = createRecognizer();
  r.step(letter, 0);
  r.step(letter, 700);
  r.step(null, 800);
  assert.equal(r.step(letter, 1500).pending, "");
  assert.equal(r.step(letter, 5000).pending, "");
  r.reset();
  assert.equal(r.step(confirm, 6000).append, undefined);
});
test("slow device (one frame every 2.2 s) can still recognize and confirm", () => {
  const r = createRecognizer();
  let t = 0,
    last;
  for (let i = 0; i < 6; i++, t += 2200) last = r.step(letter, t);
  assert.equal(last.pending, "A");
  let appended;
  for (let i = 0; i < 4; i++, t += 2200) appended ??= r.step(confirm, t).append;
  assert.equal(appended, "A");
});
test("slow device still restarts the hold after a real interruption", () => {
  const r = createRecognizer();
  for (let t = 0; t <= 4400; t += 2200) r.step(letter, t);
  // 8 s without any frame (camera hiccup): the hold must start over.
  const after = r.step(letter, 12400);
  assert.equal(after.pending, "");
  assert.ok(after.progress < 1);
});
test("normalization, mirroring, invalid import, nonmatch rejection", () => {
  const hand = Array.from({ length: 21 }, (_, i) => ({
    x: i * 0.02,
    y: i * 0.03,
    z: i * 0.001,
  }));
  const a = features(hand),
    translated = features(
      hand.map((p) => ({ x: p.x * 2 + 3, y: p.y * 2 + 4, z: p.z * 2 + 5 })),
    );
  assert.ok(poseDistance(a, translated) < 1e-12);
  const mirrored = a.map((v, i) => (i % 3 === 0 ? -v : v));
  assert.equal(poseDistance(a, mirrored), 0);
  assert.equal(validClasses([{ name: "A", samples: [a] }]), true);
  assert.equal(validClasses([{ name: "A", samples: [[1, 2]] }]), false);
  assert.equal(
    validClasses([{ name: "A", samples: [a.map(() => NaN)] }]),
    false,
  );
  assert.equal(classify(a, [{ name: "A", samples: [a] }]).name, "A");
  assert.equal(
    classify(
      a.map(() => 100),
      [{ name: "A", samples: [a] }],
    ),
    null,
  );
  assert.equal(classify(a, [{ name: "A", samples: [a] }], [a]).command, false);
});
