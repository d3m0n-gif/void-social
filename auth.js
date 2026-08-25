const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { query } = require("./db");

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured.");
}

// ============================================================
// CREATE ACCOUNT
// ============================================================

async function createUser(username, email, password) {
  username = username.trim();
  email = email.trim().toLowerCase();

  if (username.length < 3 || username.length > 32) {
    throw new Error("Username must be between 3 and 32 characters.");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const existing = await query(
    "SELECT id FROM users WHERE username = $1 OR email = $2",
    [username, email]
  );

  if (existing.rows.length > 0) {
    throw new Error("Username or email is already registered.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await query(
    `INSERT INTO users
      (username, email, password_hash, display_name)
     VALUES ($1, $2, $3, $1)
     RETURNING id, username, email, display_name, role, created_at`,
    [username, email, passwordHash]
  );

  return result.rows[0];
}

// ============================================================
// LOGIN
// ============================================================

async function loginUser(email, password) {
  email = email.trim().toLowerCase();

  const result = await query(
    `SELECT
      id,
      username,
      email,
      password_hash,
      display_name,
      avatar_url,
      bio,
      role
     FROM users
     WHERE email = $1`,
    [email]
  );

  if (result.rows.length === 0) {
    throw new Error("Invalid email or password.");
  }

  const user = result.rows[0];

  const passwordCorrect = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!passwordCorrect) {
    throw new Error("Invalid email or password.");
  }

  delete user.password_hash;

  const token = jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role
    },
    JWT_SECRET,
    {
      expiresIn: "7d"
    }
  );

  return {
    token,
    user
  };
}

// ============================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authentication required."
      });
    }

    const token = header.substring(7);

    const decoded = jwt.verify(token, JWT_SECRET);

    const result = await query(
      `SELECT
        id,
        username,
        email,
        display_name,
        avatar_url,
        bio,
        role
       FROM users
       WHERE id = $1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "User no longer exists."
      });
    }

    req.user = result.rows[0];

    next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired login session."
    });
  }
}

// ============================================================
// OWNER-ONLY MIDDLEWARE
// ============================================================

function requireOwner(req, res, next) {
  if (!req.user || req.user.role !== "owner") {
    return res.status(403).json({
      error: "Owner permission required."
    });
  }

  next();
}

module.exports = {
  createUser,
  loginUser,
  authenticate,
  requireOwner
};
