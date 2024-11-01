import { createExpressApp } from "./create-express-app.js";
import { Server } from "socket.io";
import {
  ClientToServerEventTypes,
  CombatantClass,
  ServerToClientEventTypes,
} from "@speed-dungeon/common";
import { GameServer } from "./game-server/index.js";
import { env } from "./validate-env.js";
import { gameServer, pgPool } from "./singletons.js";
import { playerCharactersRepo } from "./database/repos/player-characters.js";
import { pgOptions } from "./database/config.js";
import { valkeyManager } from "./kv-store/index.js";
import { loadLadderIntoKvStore } from "./kv-store/utils.js";
import { createCharacter } from "./game-server/character-creation/index.js";
import { generateRandomCharacterName } from "./utils/index.js";
import { raceGameRecordsRepo } from "./database/repos/race-game-records.js";

const PORT = 8080;

pgPool.connect(pgOptions);
await valkeyManager.context.connect();

await loadLadderIntoKvStore();

// await createTestCharacters();
// const rows = await raceGameRecordsRepo.findAllGamesByUserId(3);
// console.log(JSON.stringify(rows, null, 2));

const expressApp = createExpressApp();
const listening = expressApp.listen(PORT, async () => {
  const io = new Server<ClientToServerEventTypes, ServerToClientEventTypes>(listening, {
    cors: { origin: env.FRONT_END_URL, credentials: true },
  });

  console.log(`speed dungeon server on port ${PORT}`);

  gameServer.current = new GameServer(io);
});

// async function createTestCharacters() {
//   for (let i = 0; i < 45; i++) {
//     const newCharacter = createCharacter(generateRandomCharacterName(), CombatantClass.Rogue);
//     newCharacter.combatantProperties.level = Math.floor(Math.random() * 10);
//     await playerCharactersRepo.insert(newCharacter, 3);
//   }

//   console.log("created test chracaters");
// }

// async function deleteTestCharacters() {
//   for (let i = 0; i < 45; i++) {
//     await playerCharactersRepo.delete(newCharacter, 1);
//   }

//   console.log("created test chracaters");
// }
