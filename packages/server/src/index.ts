import createExpressApp from "./createExpressApp.js";
import { Server } from "socket.io";
import { ClientToServerEventTypes, ServerToClientEventTypes } from "@speed-dungeon/common";
import { GameServer } from "./game-server/index.js";

const PORT = 8080;

export let gameServer: undefined | GameServer = undefined;

const expressApp = createExpressApp();
const listening = expressApp.listen(PORT, async () => {
  const io = new Server<ClientToServerEventTypes, ServerToClientEventTypes>(listening);
  console.log(`express server on port ${PORT}`);

  gameServer = new GameServer(io);
});
