import express from "express";
import cors from "cors";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_FILE = join(__dirname, "actions.json");
const app = express();
const PORT = 3001;

// ── Simple JSON "database" ───────────────────────────────────────────────────
function readDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch {
    return {};
  }
}
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
}

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────────────────────

// GET /api/actions → { "1": ["promote","retention"], "5": ["stretch"], ... }
app.get("/api/actions", (_req, res) => {
  res.json(readDB());
});

// PUT /api/actions/:empId  body: { actions: ["promote","stretch"] }
app.put("/api/actions/:empId", (req, res) => {
  const empId = req.params.empId;
  const { actions } = req.body;

  if (!Array.isArray(actions)) {
    return res.status(400).json({ error: "actions must be an array" });
  }

  const db = readDB();
  if (actions.length === 0) {
    delete db[empId];
  } else {
    db[empId] = actions;
  }
  writeDB(db);
  res.json({ ok: true, employee_id: empId, actions });
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
  console.log(`Database file: ${DB_FILE}`);
});
