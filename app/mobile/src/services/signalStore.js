// Signals (up to 30 × 2.000 poses) are too big for AsyncStorage on Android
// (rows above ~2 MB cannot be read back), so they are kept in a JSON file.
// Writes go to a temporary file first; the main file is replaced only after
// the new content is complete. In Expo SDK 58, write() and move() are async.
import { File, Paths } from "expo-file-system";
import { validClasses, isPose } from "../recognition/matcher";
const MAIN = "alem-sinais.json",
  TEMP = "alem-sinais.tmp.json";
const empty = () => ({ classes: [], confirmation: [] });
export function parseSignals(data) {
  if (!data || !validClasses(data.classes)) throw Error("invalid signals");
  return {
    classes: data.classes,
    confirmation:
      Array.isArray(data.confirmation) && data.confirmation.every(isPose)
        ? data.confirmation
        : [],
  };
}
export async function saveSignals(signals) {
  const temp = new File(Paths.document, TEMP);
  if (temp.exists) temp.delete();
  await temp.write(JSON.stringify(signals));
  await temp.move(new File(Paths.document, MAIN), { overwrite: true });
}
// Returns { signals, writable, problem?, migrated? }.
// writable=false means the stored data could not be read nor set aside, so the
// app must not overwrite it.
export async function loadSignals(legacy) {
  const main = new File(Paths.document, MAIN);
  const temp = new File(Paths.document, TEMP);
  // A finished temporary file left behind is only used if the main one is missing.
  if (!main.exists && temp.exists) await temp.move(main, { overwrite: true });
  const current = new File(Paths.document, MAIN);
  if (current.exists) {
    try {
      return {
        signals: parseSignals(JSON.parse(await current.text())),
        writable: true,
      };
    } catch {
      try {
        await current.move(
          new File(Paths.document, `alem-sinais-ilegivel-${Date.now()}.json`),
        );
        return {
          signals: empty(),
          writable: true,
          problem: "sinais (o arquivo antigo foi guardado como cópia)",
        };
      } catch {
        return { signals: empty(), writable: false, problem: "sinais" };
      }
    }
  }
  if (legacy?.classes) {
    try {
      const signals = parseSignals(legacy);
      await saveSignals(signals);
      return { signals, writable: true, migrated: true };
    } catch {
      return {
        signals: empty(),
        writable: true,
        problem: "sinais da versão anterior",
      };
    }
  }
  return { signals: empty(), writable: true };
}
