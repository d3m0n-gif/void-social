const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL error:", err);
});

// ============================================================
// DATABASE QUERY
// ============================================================

async function query(text, params) {
  return pool.query(text, params);
}

// ============================================================
// TEST DATABASE CONNECTION
// ============================================================

async function testDatabase() {
  try {
    const result = await pool.query("SELECT NOW() AS time");

    console.log("======================================");
    console.log("PostgreSQL connected");
    console.log(`Database time: ${result.rows[0].time}`);
    console.log("======================================");

    return true;
  } catch (error) {
    console.error("PostgreSQL connection failed:");
    console.error(error.message);

    return false;
  }
}

// ============================================================
// AUTOMATICALLY RUN schema.sql
// ============================================================

async function initializeDatabase() {
  try {
    const schemaPath = path.join(__dirname, "schema.sql");

    if (!fs.existsSync(schemaPath)) {
      throw new Error("schema.sql was not found.");
    }

    const schema = fs.readFileSync(schemaPath, "utf8");

    await pool.query(schema);

    console.log("======================================");
    console.log("Database schema initialized");
    console.log("All VOID Social tables are ready");
    console.log("======================================");

    return true;
  } catch (error) {
    console.error("Database schema initialization failed:");
    console.error(error.message);

    return false;
  }
}

// ============================================================
// INITIALIZE EVERYTHING
// ============================================================

async function initializeDatabaseConnection() {
  const connected = await testDatabase();

  if (!connected) {
    return false;
  }

  const initialized = await initializeDatabase();

  return initialized;
}

module.exports = {
  pool,
  query,
  testDatabase,
  initializeDatabase,
  initializeDatabaseConnection
};
