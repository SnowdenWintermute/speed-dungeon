import {
  ActionCommandReceiver,
  CombatActionReplayTreePayload,
  ERROR_MESSAGES,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import battleResultActionCommandHandler from "./process-battle-result";
import gameMessageActionCommandHandler from "./game-message";
import { removeClientPlayerFromGame } from "./remove-client-player-from-game";
import { gameWorld } from "../3d-world/SceneManager";
import { useGameStore } from "@/stores/game-store";
import { synchronizeTargetingIndicators } from "../WebsocketManager/game-event-handlers/synchronize-targeting-indicators";

export class ClientActionCommandReceiver implements ActionCommandReceiver {
  constructor() {}
  combatActionReplayTreeHandler: (payload: CombatActionReplayTreePayload) => Promise<void | Error> =
    async (payload) => {
      const promise = new Promise((resolve, reject) => {
        useGameStore.getState().mutateState((state) => {
          synchronizeTargetingIndicators(state, null, payload.actionUserId, []);
        });

        gameWorld.current?.replayTreeManager.enqueueTree(payload, () => resolve(true));
      });
      await promise;
    };

  endActiveCombatantTurn: () => Promise<void | Error> = async () => {
    console.log("trying to end turn");
    useGameStore.getState().mutateState((state) => {
      const battleId = state.getCurrentBattleId();
      if (!battleId) return console.error("no battle but tried to end turn");
      const battleOption = state.game?.battles[battleId];
      if (!state.game) throw new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
      if (!battleOption) return console.error("no battle but tried to end turn");
      SpeedDungeonGame.endActiveCombatantTurn(state.game, battleOption);
    });
  };
  removePlayerFromGameCommandHandler = removeClientPlayerFromGame;
  battleResultActionCommandHandler = battleResultActionCommandHandler;
  gameMessageCommandHandler = gameMessageActionCommandHandler;
}
