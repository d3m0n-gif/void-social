```js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

/*
============================================================
 D3M0N SOCIAL PLATFORM
 Discord + YouTube + Instagram
============================================================
*/

// ----------------------------------------------------------
// BASIC ROUTES
// ----------------------------------------------------------

app.get("/", (req, res) => {
  res.json({
    name: "D3M0N Social",
    status: "online",
    message: "Social platform backend is running."
  });
});

app.get("/api/status", (req, res) => {
  res.json({
    online: true,
    service: "D3M0N Social API",
    version: "1.0.0"
  });
});

// ----------------------------------------------------------
// REAL-TIME SOCKET CONNECTION
// ----------------------------------------------------------

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("join-server", (serverId) => {
    socket.join(`server:${serverId}`);

    console.log(
      `${socket.id} joined server ${serverId}`
    );
  });

  socket.on("join-gc", (gcId) => {
    socket.join(`gc:${gcId}`);

    console.log(
      `${socket.id} joined group chat ${gcId}`
    );
  });

  socket.on("join-dm", (conversationId) => {
    socket.join(`dm:${conversationId}`);

    console.log(
      `${socket.id} joined DM ${conversationId}`
    );
  });

  socket.on("send-message", (data) => {
    /*
      Later this will:
      1. Check authentication
      2. Check mute/ban status
      3. Save the message to PostgreSQL
      4. Send it to the correct server/GC/DM
    */

    if (!data || !data.type || !data.message) {
      return;
    }

    if (data.type === "server") {
      io.to(`server:${data.targetId}`).emit(
        "new-message",
        data
      );
    }

    if (data.type === "gc") {
      io.to(`gc:${data.targetId}`).emit(
        "new-message",
        data
      );
    }

    if (data.type === "dm") {
      io.to(`dm:${data.targetId}`).emit(
        "new-message",
        data
      );
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// ----------------------------------------------------------
// START SERVER
// ----------------------------------------------------------

server.listen(PORT, () => {
  console.log("======================================");
  console.log(" D3M0N SOCIAL PLATFORM");
  console.log("======================================");
  console.log(`Server running on port ${PORT}`);
  console.log("Real-time chat: ENABLED");
  console.log("PostgreSQL: NEXT");
  console.log("Authentication: NEXT");
  console.log("======================================");
});
```
