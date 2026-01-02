import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import pg from "pg";

dotenv.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, "..");

app.use(express.json());
app.use(express.static(ROOT_DIR));
app.use("/backend", express.static(path.join(__dirname, "public")));
app.use("/admin", express.static(path.join(__dirname, "admin")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

const activeSessions = new Map(); 

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = auth.slice(7);
  const session = activeSessions.get(token);
  
  if (!session || Date.now() > session.expiry) {
    activeSessions.delete(token);
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  next();
}

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = generateToken();
    const expiresIn = 3600000; 
    const expiry = Date.now() + expiresIn;
    
    activeSessions.set(token, { expiry });
    
    return res.json({ 
      success: true, 
      token: token,
      expiresIn: expiresIn 
    });
  }

  res.status(401).json({ success: false, message: "Invalid credentials" });
});

app.post("/api/admin/logout", verifyToken, (req, res) => {
  const token = req.headers.authorization.slice(7);
  activeSessions.delete(token);
  res.json({ success: true });
});

app.get("/api/public/apps", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT data FROM apps WHERE id = $1",
      ["ditdev-hub"]
    );

    res.json(rows[0]?.data || { apps: [] });
  } catch (err) {
    console.error("PUBLIC API ERROR:", err);
    res.status(500).json({ error: "Failed to load apps" });
  }
});

app.get("/api/apps", verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT data FROM apps WHERE id = $1",
      ["ditdev-hub"]
    );

    res.json(rows[0]?.data || { apps: [] });
  } catch (err) {
    console.error("GET APPS ERROR:", err);
    res.status(500).json({ error: "Failed to load apps" });
  }
});

app.post("/api/apps", verifyToken, async (req, res) => {
  try {
    await pool.query(
      `
      INSERT INTO apps (id, data)
      VALUES ($1, $2::jsonb)
      ON CONFLICT (id)
      DO UPDATE SET data = EXCLUDED.data
      `,
      ["ditdev-hub", req.body]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("SAVE APPS ERROR:", err);
    res.status(500).json({ error: "Failed to save apps" });
  }
});

app.get("/api/releases/latest/:owner/:repo", async (req, res) => {
  const { owner, repo } = req.params;

  try {
    const r = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases/latest`,
      {
        headers: {
          "User-Agent": "DitDev-Hub",
          "Accept": "application/vnd.github+json"
        }
      }
    );

    if (!r.ok) {
      return res.status(404).json({ error: "Release not found" });
    }

    const data = await r.json();
    res.json(data);
  } catch (err) {
    console.error("GITHUB LATEST ERROR:", err);
    res.status(500).json({ error: "GitHub fetch failed" });
  }
});

app.get("/api/releases/:owner/:repo", async (req, res) => {
  const { owner, repo } = req.params;

  try {
    const r = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases`,
      {
        headers: {
          "User-Agent": "DitDev-Hub",
          "Accept": "application/vnd.github+json"
        }
      }
    );

    if (!r.ok) {
      return res.status(404).json({ error: "Releases not found" });
    }

    const data = await r.json();
    res.json(data);
  } catch (err) {
    console.error("GITHUB RELEASES ERROR:", err);
    res.status(500).json({ error: "GitHub fetch failed" });
  }
});

setInterval(() => {
  const now = Date.now();
  for (const [token, session] of activeSessions.entries()) {
    if (now > session.expiry) {
      activeSessions.delete(token);
    }
  }
}, 600000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
