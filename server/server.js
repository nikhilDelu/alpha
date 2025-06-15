import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", ({ roomId, userId }) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-joined", socket.id);
    console.log(`${userId} joined room ${roomId}`);
  });

  socket.on("offer", ({ targetId, offer }) => {
    io.to(targetId).emit("offer", { senderId: socket.id, offer });
  });

  socket.on("answer", ({ targetId, answer }) => {
    io.to(targetId).emit("answer", { senderId: socket.id, answer });
  });

  socket.on("ice-candidate", ({ targetId, candidate }) => {
    io.to(targetId).emit("ice-candidate", {
      senderId: socket.id,
      candidate,
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(5000, () => console.log("Server running on 5000"));
