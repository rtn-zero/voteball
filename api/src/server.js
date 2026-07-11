import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./db.js";
import matchesRouter from "./routes/matches.js";
import votesRouter from "./routes/votes.js";

const app = express();

// CORS: comma-separated allow-list from env; falls back to "reflect any origin" for local dev.
const origins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(cors({ origin: origins.length ? origins : true }));

app.use(express.json());

// Health check — hit this first to warm Render and smoke-test connectivity before the demo.
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/matches", matchesRouter);
app.use("/api/votes", votesRouter);

// Last-resort error handler so a thrown route never leaks a stack trace to the client.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3000;

connectDB(process.env.MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`Voteball API listening on :${PORT}`));
  })
  .catch((err) => {
    console.error("DB connection failed:", err.message);
    process.exit(1);
  });

export default app;
