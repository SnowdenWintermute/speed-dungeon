import createExpressApp from "./createExpressApp";
import SocketIO from "socket.io";
import {
  ClientToServerEventTypes,
  ClientToServerEvents,
  ServerToClientEventTypes,
} from "@speed-dungeon/common";
import { GameServer } from "./game-server";

const PORT = 8080;

export let gameServer: undefined | GameServer = undefined;

const expressApp = createExpressApp();
const listening = expressApp.listen(PORT, async () => {
  const io = new SocketIO.Server<
    ClientToServerEventTypes,
    ServerToClientEventTypes
  >(listening);
  console.log(`express server on port ${PORT}`);

  gameServer = new GameServer(io);
});
