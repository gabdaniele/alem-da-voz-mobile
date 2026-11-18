import { createApp } from "./app.js";
import { openDatabase } from "./services/database.js";
const db = openDatabase();
const server = createApp(db, process.env.JWT_SECRET).listen(
  Number(process.env.PORT || 3000),
  "0.0.0.0",
  () =>
    console.log(
      "API Além da Voz disponível na porta " + (process.env.PORT || 3000),
    ),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () =>
    server.close(() => {
      db.close();
      process.exit(0);
    }),
  );
