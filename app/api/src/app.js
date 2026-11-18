import express from "express";
import helmet from "helmet";
import cors from "cors";
import { routes } from "./routes/index.js";
export function createApp(db, secret) {
  if (!secret || secret.length < 32)
    throw Error(
      "Defina JWT_SECRET com pelo menos 32 caracteres no arquivo .env.",
    );
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "32kb" }));
  app.use(routes(db, secret));
  app.use((_req, res) =>
    res.status(404).json({ message: "Endpoint não encontrado." }),
  );
  app.use((error, _req, res, _next) => {
    const status = error.status || 500;
    if (status >= 500) console.error(error);
    res
      .status(status)
      .json({
        message:
          status >= 500 ? "Falha no servidor. Tente novamente." : error.message,
      });
  });
  return app;
}
