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

const loginAttempts = new Map(); 

const RATE_LIMIT = {
  MAX_ATTEMPTS: 5,
  WINDOW_MS: 15 * 60 * 1000, 
  BLOCK_DURATION_MS: 30 * 60 * 1000 
};

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

function rateLimitLogin(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const attempt = loginAttempts.get(ip);

  if (attempt?.blockedUntil && now < attempt.blockedUntil) {
    const remainingTime = Math.ceil((attempt.blockedUntil - now) / 60000);
    return res.status(429).json({
      success: false,
      error: "Too many failed attempts",
      message: `Account temporarily locked. Try again in ${remainingTime} minutes.`,
      retryAfter: remainingTime
    });
  }

  if (attempt && now - attempt.lastAttempt > RATE_LIMIT.WINDOW_MS) {
    loginAttempts.delete(ip);
  }

  next();
}

function trackFailedLogin(ip) {
  const now = Date.now();
  const attempt = loginAttempts.get(ip) || { count: 0, lastAttempt: now };

  attempt.count += 1;
  attempt.lastAttempt = now;

  if (attempt.count >= RATE_LIMIT.MAX_ATTEMPTS) {
    attempt.blockedUntil = now + RATE_LIMIT.BLOCK_DURATION_MS;
    console.warn(`⚠️  IP ${ip} blocked for ${RATE_LIMIT.BLOCK_DURATION_MS / 60000} minutes`);
  }

  loginAttempts.set(ip, attempt);
}

function clearLoginAttempts(ip) {
  loginAttempts.delete(ip);
}

function verifyToken(req, res, next) {
  try {
    const auth = req.headers.authorization;
    
    if (!auth?.startsWith("Bearer ")) {
      return res.status(401).json({ 
        success: false,
        error: "Unauthorized",
        message: "Missing or invalid authorization header" 
      });
    }

    const token = auth.slice(7);
    const session = activeSessions.get(token);
    
    if (!session || Date.now() > session.expiry) {
      activeSessions.delete(token);
      return res.status(401).json({ 
        success: false,
        error: "Invalid token",
        message: "Token expired or invalid. Please login again." 
      });
    }

    next();
  } catch (err) {
    console.error("TOKEN VERIFICATION ERROR:", err);
    res.status(500).json({ 
      success: false,
      error: "Server error",
      message: "Failed to verify token" 
    });
  }
}

app.post("/api/admin/login", rateLimitLogin, (req, res) => {
  try {
    const { username, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        error: "Bad request",
        message: "Username and password are required" 
      });
    }

    if (
      username === process.env.ADMIN_USERNAME &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = generateToken();
      const expiresIn = 3600000; // 1 hour
      const expiry = Date.now() + expiresIn;
      
      activeSessions.set(token, { expiry, ip });
      clearLoginAttempts(ip);
      
      console.log(`✅ Login success from IP: ${ip}`);
      
      return res.json({ 
        success: true, 
        token: token,
        expiresIn: expiresIn,
        message: "Login successful"
      });
    }

    trackFailedLogin(ip);
    const attempt = loginAttempts.get(ip);
    const remaining = RATE_LIMIT.MAX_ATTEMPTS - attempt.count;

    console.warn(`⚠️  Failed login attempt from IP: ${ip} (${attempt.count}/${RATE_LIMIT.MAX_ATTEMPTS})`);

    res.status(401).json({ 
      success: false,
      error: "Invalid credentials",
      message: "Invalid username or password",
      attemptsRemaining: remaining > 0 ? remaining : 0
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ 
      success: false,
      error: "Server error",
      message: "An error occurred during login" 
    });
  }
});

app.post("/api/admin/logout", verifyToken, (req, res) => {
  try {
    const token = req.headers.authorization.slice(7);
    activeSessions.delete(token);
    
    res.json({ 
      success: true,
      message: "Logged out successfully" 
    });
  } catch (err) {
    console.error("LOGOUT ERROR:", err);
    res.status(500).json({ 
      success: false,
      error: "Server error",
      message: "Failed to logout" 
    });
  }
});

app.get("/api/public/apps", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT data FROM apps WHERE id = $1",
      ["ditdev-hub"]
    );

    if (!rows || rows.length === 0) {
      return res.json({ apps: [] });
    }

    res.json(rows[0].data || { apps: [] });
  } catch (err) {
    console.error("PUBLIC API ERROR:", err);
    res.status(500).json({ 
      error: "Server error",
      message: "Failed to load apps" 
    });
  }
});

app.get("/api/apps", verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT data FROM apps WHERE id = $1",
      ["ditdev-hub"]
    );

    if (!rows || rows.length === 0) {
      return res.json({ apps: [] });
    }

    res.json(rows[0].data || { apps: [] });
  } catch (err) {
    console.error("GET APPS ERROR:", err);
    
    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: "Database unavailable",
        message: "Cannot connect to database" 
      });
    }
    
    res.status(500).json({ 
      error: "Server error",
      message: "Failed to load apps" 
    });
  }
});

app.post("/api/apps", verifyToken, async (req, res) => {
  try {
    const { apps } = req.body;

    if (!apps || !Array.isArray(apps)) {
      return res.status(400).json({ 
        success: false,
        error: "Bad request",
        message: "Invalid data format. Expected { apps: [] }" 
      });
    }

    await pool.query(
      `
      INSERT INTO apps (id, data)
      VALUES ($1, $2::jsonb)
      ON CONFLICT (id)
      DO UPDATE SET data = EXCLUDED.data
      `,
      ["ditdev-hub", req.body]
    );

    res.json({ 
      success: true,
      message: "Apps saved successfully" 
    });
  } catch (err) {
    console.error("SAVE APPS ERROR:", err);
    
    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        success: false,
        error: "Database unavailable",
        message: "Cannot connect to database" 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: "Server error",
      message: "Failed to save apps" 
    });
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
      if (r.status === 404) {
        return res.status(404).json({ 
          error: "Not found",
          message: "Release not found for this repository" 
        });
      }
      throw new Error(`GitHub API returned ${r.status}`);
    }

    const data = await r.json();
    res.json(data);
  } catch (err) {
    console.error("GITHUB LATEST ERROR:", err);
    res.status(500).json({ 
      error: "Server error",
      message: "Failed to fetch latest release from GitHub" 
    });
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
      if (r.status === 404) {
        return res.status(404).json({ 
          error: "Not found",
          message: "Releases not found for this repository" 
        });
      }
      throw new Error(`GitHub API returned ${r.status}`);
    }

    const data = await r.json();
    res.json(data);
  } catch (err) {
    console.error("GITHUB RELEASES ERROR:", err);
    res.status(500).json({ 
      error: "Server error",
      message: "Failed to fetch releases from GitHub" 
    });
  }
});

app.use((err, req, res, next) => {
  console.error("UNHANDLED ERROR:", err);
  res.status(500).json({ 
    error: "Server error",
    message: "An unexpected error occurred" 
  });
});

setInterval(() => {
  const now = Date.now();
  
  for (const [token, session] of activeSessions.entries()) {
    if (now > session.expiry) {
      activeSessions.delete(token);
    }
  }
  
  for (const [ip, attempt] of loginAttempts.entries()) {
    if (attempt.blockedUntil && now > attempt.blockedUntil) {
      loginAttempts.delete(ip);
    }
  }
}, 600000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
