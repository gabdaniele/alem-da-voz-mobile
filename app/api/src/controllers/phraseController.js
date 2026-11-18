import { randomUUID } from "node:crypto";
import { validatePhrase, serializePhrase } from "../services/phrases.js";
export function phraseController(db) {
  const find = (req) =>
    db
      .prepare("SELECT * FROM phrases WHERE id=? AND user_id=?")
      .get(req.params.id, req.user.id);
  return {
    list(req, res) {
      res.json(
        db
          .prepare(
            "SELECT * FROM phrases WHERE user_id=? ORDER BY updated_at DESC",
          )
          .all(req.user.id)
          .map(serializePhrase),
      );
    },
    get(req, res) {
      const row = find(req);
      row
        ? res.json(serializePhrase(row))
        : res.status(404).json({ message: "Frase não encontrada." });
    },
    create(req, res) {
      const { text, favorite } = validatePhrase(req.body),
        id = randomUUID(),
        now = new Date().toISOString();
      db.prepare("INSERT INTO phrases VALUES (?,?,?,?,?,?)").run(
        id,
        req.user.id,
        text,
        favorite,
        now,
        now,
      );
      res
        .status(201)
        .json(
          serializePhrase(
            db.prepare("SELECT * FROM phrases WHERE id=?").get(id),
          ),
        );
    },
    update(req, res) {
      if (!find(req))
        return res.status(404).json({ message: "Frase não encontrada." });
      const { text, favorite } = validatePhrase(req.body);
      db.prepare(
        "UPDATE phrases SET text=?,favorite=?,updated_at=? WHERE id=? AND user_id=?",
      ).run(
        text,
        favorite,
        new Date().toISOString(),
        req.params.id,
        req.user.id,
      );
      res.json(serializePhrase(find(req)));
    },
    remove(req, res) {
      if (!find(req))
        return res.status(404).json({ message: "Frase não encontrada." });
      db.prepare("DELETE FROM phrases WHERE id=? AND user_id=?").run(
        req.params.id,
        req.user.id,
      );
      res.status(204).end();
    },
  };
}
