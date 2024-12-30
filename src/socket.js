import { Server } from "socket.io";

let io; 

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*", 
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  return io;
}

export function getSocket() {
  if (!io) {
    throw new Error("Socket.IO is not initialized. Call initSocket first.");
  }
  return io;
}
