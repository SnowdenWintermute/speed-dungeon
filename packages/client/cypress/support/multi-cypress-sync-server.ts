import { Server } from "socket.io";

export const CYPRESS_SYNC_SERVER_PORT = 9090;
const io = new Server(CYPRESS_SYNC_SERVER_PORT);

let lastCheckpoint: string;

io.on("connection", (socket) => {
  if (lastCheckpoint) {
    socket.emit("checkpoint", lastCheckpoint);
  }

  socket.on("disconnect", () => {});

  socket.on("checkpoint", (name) => {
    lastCheckpoint = name;
    io.emit("checkpoint", name);
  });
});
