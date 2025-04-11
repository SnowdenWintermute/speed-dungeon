import { ActionCommandReceiver, CombatActionReplayTreePayload } from "@speed-dungeon/common";
import battleResultActionCommandHandler from "./process-battle-result";
import gameMessageActionCommandHandler from "./game-message";
import { removeClientPlayerFromGame } from "./remove-client-player-from-game";
import { gameWorld } from "../3d-world/SceneManager";

export class ClientActionCommandReceiver implements ActionCommandReceiver {
  constructor() {}
  combatActionReplayTreeHandler: (payload: CombatActionReplayTreePayload) => Promise<void | Error> =
    async (payload) => {
      gameWorld.current?.replayTreeManager.enqueueTree(payload.root);
    };
  removePlayerFromGameCommandHandler = removeClientPlayerFromGame;
  battleResultActionCommandHandler = battleResultActionCommandHandler;
  gameMessageCommandHandler = gameMessageActionCommandHandler;
}
