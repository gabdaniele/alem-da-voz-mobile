import { randomUUID } from "node:crypto";
import {
  hashPassword,
  verifyPassword,
  tokenFor,
  publicUser,
} from "../services/auth.js";
function credentials(body) {
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254 ||
    password.length < 8 ||
    password.length > 128
  ) {
    const error = new Error(
      "Informe um e-mail válido e uma senha de 8 a 128 caracteres.",
    );
    error.status = 400;
    throw error;
  }
  return { email, password };
}
export function authController(db, secret) {
  return {
    async register(req, res) {
      const { email, password } = credentials(req.body);
      const name =
        typeof req.body.name === "string" ? req.body.name.trim() : "";
      if (name.length < 2 || name.length > 80)
        return res
          .status(400)
          .json({ message: "O nome deve ter entre 2 e 80 caracteres." });
      const user = { id: randomUUID(), name, email };
      const hash = await hashPassword(password);
      try {
        db.prepare("INSERT INTO users VALUES (?,?,?,?,?)").run(
          user.id,
          name,
          email,
          hash,
          new Date().toISOString(),
        );
      } catch (e) {
        if (String(e.message).includes("UNIQUE"))
          return res
            .status(409)
            .json({ message: "Este e-mail já tem uma conta." });
        throw e;
      }
      res.status(201).json({ user, token: tokenFor(user, secret) });
    },
    async login(req, res) {
      const { email, password } = credentials(req.body);
      const user = db.prepare("SELECT * FROM users WHERE email=?").get(email);
      if (!user || !(await verifyPassword(password, user.password_hash)))
        return res.status(401).json({ message: "E-mail ou senha incorretos." });
      res.json({ user: publicUser(user), token: tokenFor(user, secret) });
    },
    me(req, res) {
      res.json(publicUser(req.user));
    },
  };
}
