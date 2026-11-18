import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { authController } from "../controllers/authController.js";
import { phraseController } from "../controllers/phraseController.js";
import { authenticate } from "../middleware/authenticate.js";
export function routes(db, secret) {
  const router = Router(),
    auth = authController(db, secret),
    phrases = phraseController(db);
  const limit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Muitas tentativas. Aguarde alguns minutos." },
  });
  router.get("/health", (_req, res) => res.json({ status: "ok" }));
  router.post("/auth/register", limit, auth.register);
  router.post("/auth/login", limit, auth.login);
  // Only protected paths require a token; unknown paths fall through to 404.
  router.use(["/auth/me", "/phrases"], authenticate(db, secret));
  router.get("/auth/me", auth.me);
  router.route("/phrases").get(phrases.list).post(phrases.create);
  router
    .route("/phrases/:id")
    .get(phrases.get)
    .put(phrases.update)
    .delete(phrases.remove);
  return router;
}
