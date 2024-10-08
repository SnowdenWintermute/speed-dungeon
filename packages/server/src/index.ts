import createExpressApp from "./create-express-app.js";
import { Server } from "socket.io";
import { ClientToServerEventTypes, ServerToClientEventTypes } from "@speed-dungeon/common";
import { GameServer } from "./game-server/index.js";
import { env } from "./validate-env.js";

const PORT = 8080;

export let gameServer: undefined | GameServer = undefined;

const expressApp = createExpressApp();
const listening = expressApp.listen(PORT, async () => {
  const io = new Server<ClientToServerEventTypes, ServerToClientEventTypes>(listening, {
    cors: { origin: env.FRONT_END_URL, credentials: true },
  });

  console.log(`speed dungeon server on port ${PORT}`);

  gameServer = new GameServer(io);
});
