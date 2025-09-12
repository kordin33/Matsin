import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./routes";
import { initDb } from "./db";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3005);
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

// Support multiple origins via comma-separated list, or allow all via "*"
const origins = CORS_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean);
app.use(
  cors({
    origin: CORS_ORIGIN === "*" ? true : origins,
    credentials: true,
  }),
);

// Middleware for handling raw binary data for exportToBackend
// JSON middleware for routes
app.use(express.json({ limit: "2mb" }));

app.use(router);

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[Backned] API listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to init DB", err);
    process.exit(1);
  });
