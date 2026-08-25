require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const {
  initializeDatabaseConnection
} = require("./db");

const {
  createUser,
  loginUser,
  authenticate,
  requireOwner
} = require("./auth");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

// ============================================================
// SOCKET.IO
// ============================================================

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(cors());
app.use(express.json());

// ============================================================
// BASIC ROUTES
// ============================================================

app.get("/", (req, res) => {
  res.json({
    name: "VOID Social",
    status: "online",
    version: "1.0.0"
  });
});

app.get("/api/status", (req, res) => {
  res.json({
    online: true,
    service: "VOID Social API",
    database: "connected",
    authentication: "enabled",
    realtimeChat: "enabled"
  });
});

// ============================================================
// AUTHENTICATION
// ============================================================

// SIGN UP
app.post("/api/auth/signup", async (req, res) => {
  try {
    const {
      username,
      email,
      password
    } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        error: "Username, email, and password are required."
      });
    }

    const user = await createUser(
      username,
      email,
      password
    );

    return res.status(201).json({
      message: "Account created successfully.",
      user
    });

  } catch (error) {
    console.error("Signup error:", error.message);

    return res.status(400).json({
      error: error.message
    });
  }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required."
      });
    }

    const result = await loginUser(
      email,
      password
    );

    return res.json(result);

  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(401).json({
      error: error.message
    });
  }
});

// CURRENT USER
app.get(
  "/api/auth/me",
  authenticate,
  (req, res) => {
    res.json({
      user: req.user
    });
  }
);

// ============================================================
// OWNER TEST
// ============================================================

app.get(
  "/api/owner/test",
  authenticate,
  requireOwner,
  (req, res) => {
    res.json({
      message: "Owner authentication works.",
      owner: req.user.username
    });
  }
);

// ============================================================
// REAL-TIME CHAT
// ============================================================

io.on("connection", (socket) => {
  console.log(
    `User connected: ${socket.id}`
  );

  // ----------------------------------------------------------
  // JOIN SERVER
  // ----------------------------------------------------------

  socket.on("join-server", (serverId) => {
    if (!serverId) {
      return;
    }

    socket.join(`server:${serverId}`);

    console.log(
      `${socket.id} joined server ${serverId}`
    );
  });

  // ----------------------------------------------------------
  // JOIN GROUP CHAT
  // ----------------------------------------------------------

  socket.on("join-gc", (gcId) => {
    if (!gcId) {
      return;
    }

    socket.join(`gc:${gcId}`);

    console.log(
      `${socket.id} joined GC ${gcId}`
    );
  });

  // ----------------------------------------------------------
  // JOIN DIRECT MESSAGE
  // ----------------------------------------------------------

  socket.on("join-dm", (conversationId) => {
    if (!conversationId) {
      return;
    }

    socket.join(`dm:${conversationId}`);

    console.log(
      `${socket.id} joined DM ${conversationId}`
    );
  });

  // ----------------------------------------------------------
  // SEND MESSAGE
  // ----------------------------------------------------------

  socket.on("send-message", (data) => {
    if (!data) {
      return;
    }

    if (!data.type) {
      return;
    }

    if (!data.message) {
      return;
    }

    if (!data.targetId) {
      return;
    }

    // SERVER MESSAGE
    if (data.type === "server") {
      io.to(`server:${data.targetId}`).emit(
        "new-message",
        data
      );
    }

    // GROUP CHAT MESSAGE
    if (data.type === "gc") {
      io.to(`gc:${data.targetId}`).emit(
        "new-message",
        data
      );
    }

    // DIRECT MESSAGE
    if (data.type === "dm") {
      io.to(`dm:${data.targetId}`).emit(
        "new-message",
        data
      );
    }
  });

  // ----------------------------------------------------------
  // DISCONNECT
  // ----------------------------------------------------------

  socket.on("disconnect", () => {
    console.log(
      `User disconnected: ${socket.id}`
    );
  });
});

// ============================================================
// START SERVER
// ============================================================

async function startServer() {
  console.log("======================================");
  console.log("Starting VOID Social...");
  console.log("======================================");

  const databaseReady =
    await initializeDatabaseConnection();

  if (!databaseReady) {
    console.error(
      "Database initialization failed."
    );

    process.exit(1);
  }

  server.listen(PORT, () => {
    console.log("======================================");
    console.log("VOID SOCIAL");
    console.log("======================================");
    console.log(
      `Server running on port ${PORT}`
    );
    console.log("PostgreSQL: ENABLED");
    console.log("Authentication: ENABLED");
    console.log("Real-time chat: ENABLED");
    console.log("Database schema: READY");
    console.log("======================================");
  });
}

startServer();
