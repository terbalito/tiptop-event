import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: "*" }
  });

  io.on("connection", (socket) => {
    console.log("Un contrôleur ou admin est connecté:", socket.id);
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io non initialisé");
  return io;
};
