import { Server } from "socket.io";

export const CYPRESS_SYNC_SERVER_PORT = 9090;
const io = new Server(CYPRESS_SYNC_SERVER_PORT);

console.log("started cypress sync socket.io server");
let lastCheckpoint: string;

io.on("connection", (socket) => {
  console.log("a cypress instance connected");

  if (lastCheckpoint) {
    console.log('sending the last checkpoint "%s"', lastCheckpoint);
    socket.emit("checkpoint", lastCheckpoint);
  }

  socket.on("disconnect", () => {
    console.log("disconnected");
  });

  socket.on("checkpoint", (name) => {
    console.log('chat checkpoint: "%s"', name);
    lastCheckpoint = name;
    io.emit("checkpoint", name);
  });
});
