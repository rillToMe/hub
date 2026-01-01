import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JSON_FILE = path.join(__dirname, "../assets/data/apps.json");

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL
});

async function migrate() {
  try {
    await client.connect();
    console.log("✅ Connected to PostgreSQL (Neon)");

    const raw = await fs.readFile(JSON_FILE, "utf8");
    const json = JSON.parse(raw);

    await client.query(
      `
      INSERT INTO apps (id, data)
      VALUES ($1, $2::jsonb)
      ON CONFLICT (id)
      DO UPDATE SET data = EXCLUDED.data
      `,
      ["ditdev-hub", json]
    );

    console.log("✅ Migration completed successfully");
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
}

migrate();
