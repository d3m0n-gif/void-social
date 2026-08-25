require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const { testDatabase } = require("./db");

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

app.get("/", (req, res) => {
res.json({
name: "VOID Social",
status: "online"
});
});

app.get("/api/status", async (req, res) => {
res.json({
online: true,
service: "VOID Social API",
database: "connected"
});
});

io.on("connection", (socket) => {
console.log(`User connected: ${socket.id}`);

socket.on("join-server", (serverId) => {
socket.join(`server:${serverId}`);
});

socket.on("join-gc", (gcId) => {
socket.join(`gc:${gcId}`);
});

socket.on("join-dm", (conversationId) => {
socket.join(`dm:${conversationId}`);
});

socket.on("send-message", (data) => {
if (!data || !data.type || !data.message) {
return;
}

```
if (data.type === "server") {
  io.to(`server:${data.targetId}`).emit("new-message", data);
}

if (data.type === "gc") {
  io.to(`gc:${data.targetId}`).emit("new-message", data);
}

if (data.type === "dm") {
  io.to(`dm:${data.targetId}`).emit("new-message", data);
}
```

});

socket.on("disconnect", () => {
console.log(`User disconnected: ${socket.id}`);
});
});

async function startServer() {
await testDatabase();

server.listen(PORT, () => {
console.log("======================================");
console.log(" VOID SOCIAL");
console.log("======================================");
console.log(`Server running on port ${PORT}`);
console.log("Real-time chat: ENABLED");
console.log("PostgreSQL: ENABLED");
console.log("======================================");
});
}

startServer();
