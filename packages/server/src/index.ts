import { createExpressApp } from "./create-express-app.js";
import { Server } from "socket.io";
import {
  ClientToServerEventTypes,
  CombatActionExecutionIntent,
  CombatActionName,
  CombatActionTarget,
  CombatActionTargetType,
  FriendOrFoe,
  Replayer,
  ServerToClientEventTypes,
} from "@speed-dungeon/common";
import { GameServer } from "./game-server/index.js";
import { env } from "./validate-env.js";
import { gameServer, idGenerator } from "./singletons.js";
import { pgPool } from "./singletons/pg-pool.js";
import { pgOptions } from "./database/config.js";
import { valkeyManager } from "./kv-store/index.js";
import { loadLadderIntoKvStore } from "./kv-store/utils.js";
import runMigrations from "./database/run-migrations.js";
import { setUpTestGameWithPartyInBattle } from "./game-server/utils/testing/index.js";
import { processCombatAction } from "./game-server/game-event-handlers/character-uses-selected-combat-action-handler/process-combat-action.js";

const PORT = 8080;

await runMigrations();
pgPool.connect(pgOptions);
await valkeyManager.context.connect();

await loadLadderIntoKvStore();

const expressApp = createExpressApp();
const listening = expressApp.listen(PORT, async () => {
  const io = new Server<ClientToServerEventTypes, ServerToClientEventTypes>(listening, {
    cors: { origin: env.FRONT_END_URL, credentials: true },
  });

  console.info(`speed dungeon server on port ${PORT}`);

  gameServer.current = new GameServer(io);

  const combatantContext = setUpTestGameWithPartyInBattle(idGenerator);
  const { game, party, combatant } = combatantContext;
  const combatants = Object.values(party.characters).concat(
    Object.values(party.currentRoom.monsters)
  );
  const combatantPositions = combatants.map((combatant) => [
    combatant.entityProperties.name,
    combatant.combatantProperties.position,
  ]);

  const opponents = combatantContext.getOpponents();
  const firstOpponentOption = opponents[0];
  if (!firstOpponentOption) throw new Error("no targets");

  const targets: CombatActionTarget = {
    type: CombatActionTargetType.Single,
    targetId: firstOpponentOption.entityProperties.id,
  };
  // const targets: CombatActionTarget = {
  //   type: CombatActionTargetType.Group,
  //   friendOrFoe: FriendOrFoe.Hostile
  // };
  combatant.combatantProperties.combatActionTarget = targets;
  // console.log(JSON.stringify(combatantPositions, null, 2));

  const result = processCombatAction(
    new CombatActionExecutionIntent(CombatActionName.Attack, targets),
    combatantContext
  );
  if (result instanceof Error) console.error(result);
  else {
    console.log("REPLAY TREE: ");
    Replayer.printReplayTree(result);
  }
});
