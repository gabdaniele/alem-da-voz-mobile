export function isPose(pose) {
  return (
    Array.isArray(pose) && pose.length === 63 && pose.every(Number.isFinite)
  );
}
export function validClasses(classes) {
  return (
    Array.isArray(classes) &&
    classes.length <= 30 &&
    classes.every(
      (c) =>
        typeof c.name === "string" &&
        c.name.trim().length > 0 &&
        c.name.length <= 40 &&
        Array.isArray(c.samples) &&
        c.samples.length <= 2000 &&
        c.samples.every(isPose),
    )
  );
}
export function features(hand) {
  const origin = hand[0],
    scale = Math.max(
      0.001,
      Math.hypot(
        hand[9].x - origin.x,
        hand[9].y - origin.y,
        hand[9].z - origin.z,
      ),
    );
  return hand.flatMap((p) => [
    (p.x - origin.x) / scale,
    (p.y - origin.y) / scale,
    (p.z - origin.z) / scale,
  ]);
}
function directDistance(a, b, relaxed) {
  let best = Infinity;
  for (const degrees of relaxed ? [-25, -12, 0, 12, 25] : [0]) {
    const angle = (degrees * Math.PI) / 180,
      c = Math.cos(angle),
      s = Math.sin(angle);
    let sum = 0;
    for (let i = 0; i < 63; i += 3)
      sum +=
        (a[i] - (b[i] * c - b[i + 1] * s)) ** 2 +
        (a[i + 1] - (b[i] * s + b[i + 1] * c)) ** 2 +
        (relaxed ? 0.35 : 1) * (a[i + 2] - b[i + 2]) ** 2;
    best = Math.min(best, Math.sqrt(sum / 63));
  }
  return best;
}
export function poseDistance(a, b, relaxed = true) {
  const direct = directDistance(a, b, relaxed);
  return relaxed
    ? Math.min(
        direct,
        directDistance(
          a,
          b.map((v, i) => (i % 3 === 0 ? -v : v)),
          true,
        ),
      )
    : direct;
}
export function classify(pose, classes, confirmation = [], threshold = 0.38) {
  if (!isPose(pose)) return null;
  const ranked = classes
    .filter((c) => c.samples.length)
    .map((c) => ({
      name: c.name,
      distance: Math.min(...c.samples.map((s) => poseDistance(pose, s))),
    }))
    .sort((a, b) => a.distance - b.distance);
  const commandDistance = Math.min(
    Infinity,
    ...confirmation.map((s) => poseDistance(pose, s, false)),
  );
  let strictLetterDistance = Infinity;
  for (const item of classes)
    for (const sample of item.samples)
      strictLetterDistance = Math.min(
        strictLetterDistance,
        poseDistance(pose, sample, false),
      );
  if (
    commandDistance <= 0.18 &&
    strictLetterDistance - commandDistance >= 0.035
  )
    return { name: "Confirmar", command: true };
  if (!ranked.length || ranked[0].distance > threshold) return null;
  return { name: ranked[0].name, command: false };
}
// Pure state machine: candidate changes reset the timer; a held confirmation cannot repeat.
// A pause longer than the gap limit restarts the hold. The limit grows with the
// measured time between frames, so slow phones (one frame every 2 s or more)
// can still complete a hold instead of being reset on every frame.
// The frame-rate estimate survives reset(): device speed does not change on pause.
export const MIN_GAP_MS = 1800;
export function createRecognizer({ letterMs = 1300, confirmMs = 900 } = {}) {
  let averageInterval = 0;
  let candidate = "",
    since = 0,
    lastAt = null,
    frames = 0,
    pending = "",
    release = false,
    releaseAt = null;
  return {
    reset() {
      candidate = "";
      since = 0;
      lastAt = null;
      frames = 0;
      pending = "";
      release = false;
      releaseAt = null;
    },
    step(prediction, now) {
      const key = prediction
        ? prediction.command
          ? "command"
          : prediction.name
        : "";
      const interval = lastAt === null ? null : now - lastAt;
      const gapLimit = Math.max(MIN_GAP_MS, averageInterval * 2.5);
      const gap = interval === null || interval > gapLimit;
      // Learn the device's frame rate; ignore very long pauses (app paused etc.).
      if (interval !== null && interval > 0 && interval < 10000)
        averageInterval = averageInterval
          ? averageInterval * 0.7 + interval * 0.3
          : interval;
      lastAt = now;
      if (release) {
        if (key === "command") {
          releaseAt = null;
          return {
            pending: "",
            progress: 0,
            hint: "Solte o gesto para continuar.",
          };
        }
        if (releaseAt === null) releaseAt = now;
        if (now - releaseAt < 650)
          return {
            pending: "",
            progress: 0,
            hint: "Solte o gesto para continuar.",
          };
        release = false;
        candidate = "";
      }
      if (!prediction) {
        candidate = "";
        frames = 0;
        return {
          pending,
          progress: 0,
          hint: pending
            ? "Faça seu gesto de confirmação."
            : "Mostre uma mão inteira à câmera.",
        };
      }
      if (prediction.command && !pending)
        return {
          pending: "",
          progress: 0,
          hint: "Mostre uma letra antes de confirmar.",
        };
      if (!prediction.command && prediction.name === pending)
        return {
          pending,
          progress: 1,
          hint: "Letra pronta. Faça o gesto de confirmação.",
        };
      if (candidate !== key || gap) {
        candidate = key;
        since = now;
        frames = 0;
      }
      frames++;
      const progress = Math.min(
        1,
        (now - since) / (prediction.command ? confirmMs : letterMs),
      );
      if (progress < 1 || frames < 3)
        return {
          pending,
          progress,
          hint: prediction.command
            ? "Confirmando… mantenha o gesto."
            : "Reconhecendo… mantenha o sinal.",
        };
      if (prediction.command) {
        const append = pending;
        pending = "";
        release = true;
        releaseAt = null;
        candidate = "";
        return {
          pending,
          progress: 1,
          append,
          hint: "Letra salva! Solte o gesto.",
        };
      }
      pending = prediction.name;
      return {
        pending,
        progress: 1,
        hint: "Letra pronta. Faça o gesto de confirmação.",
      };
    },
  };
}
