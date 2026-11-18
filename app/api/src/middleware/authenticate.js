import jwt from "jsonwebtoken";
export const authenticate = (db, secret) => (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) throw Error();
    const claims = jwt.verify(header.slice(7), secret, {
      algorithms: ["HS256"],
      issuer: "alem-da-voz",
      audience: "mobile",
    });
    const user = db.prepare("SELECT * FROM users WHERE id=?").get(claims.sub);
    if (!user) throw Error();
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Sua sessão expirou. Entre novamente." });
  }
};
