import {
  ActionCommandReceiver,
  CombatActionName,
  CombatActionReplayTreePayload,
  ERROR_MESSAGES,
  InputLock,
} from "@speed-dungeon/common";
import battleResultActionCommandHandler from "./process-battle-result";
import gameMessageActionCommandHandler from "./game-message";
import { removeClientPlayerFromGame } from "./remove-client-player-from-game";
import { gameWorld } from "../3d-world/SceneManager";
import { baseMenuState, useGameStore } from "@/stores/game-store";
import { synchronizeTargetingIndicators } from "../websocket-manager/game-event-handlers/synchronize-targeting-indicators";
import { MenuStateType } from "../game/ActionMenu/menu-state";
import getCurrentParty from "@/utils/getCurrentParty";

export class ClientActionCommandReceiver implements ActionCommandReceiver {
  constructor() {}
  combatActionReplayTreeHandler: (payload: CombatActionReplayTreePayload) => Promise<void | Error> =
    async (payload) => {
      const promise = new Promise((resolve, reject) => {
        useGameStore.getState().mutateState((state) => {
          synchronizeTargetingIndicators(state, null, payload.actionUserId, []);

          const playerResult = state.getPlayer();
          if (playerResult instanceof Error) throw playerResult;
          if (playerResult.characterIds.includes(payload.actionUserId)) {
            const inventoryIsOpen = (() => {
              for (const menuState of state.stackedMenuStates) {
                if (menuState.type === MenuStateType.InventoryItems) return true;
              }
            })();
            if (inventoryIsOpen) {
              let currentMenu = state.getCurrentMenu();
              while (
                currentMenu &&
                currentMenu.type !== MenuStateType.InventoryItems &&
                currentMenu.type !== MenuStateType.Base
              ) {
                state.stackedMenuStates.pop();
                currentMenu =
                  state.stackedMenuStates[state.stackedMenuStates.length - 1] || baseMenuState;
              }
            }
          }
        });

        gameWorld.current?.replayTreeManager.enqueueTree(payload, () => resolve(true));
      });
      await promise;
    };

  addDelayToFastestActorTurnSchedulerInBattle: (
    actionNameOption: null | CombatActionName
  ) => Promise<void | Error> = async (actionNameOption) => {
    useGameStore.getState().mutateState((state) => {
      const battleId = state.getCurrentBattleId();
      if (!battleId) return console.error("no battle but tried to end turn");
      const battleOption = state.game?.battles[battleId];
      if (!state.game) throw new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
      if (!battleOption) return console.error("no battle but tried to end turn");

      battleOption.turnOrderManager.updateSchedulerWithExecutedActionDelay(actionNameOption);
      battleOption.turnOrderManager.updateTrackers();

      const partyOption = getCurrentParty(state, state.username || "");
      if (!partyOption) throw new Error(ERROR_MESSAGES.PLAYER.MISSING_PARTY_NAME);
      if (battleOption.turnOrderManager.currentActorIsPlayerControlled(partyOption)) {
        InputLock.unlockInput(partyOption.inputLock);
      }
    });
  };
  removePlayerFromGameCommandHandler = removeClientPlayerFromGame;
  battleResultActionCommandHandler = battleResultActionCommandHandler;
  gameMessageCommandHandler = gameMessageActionCommandHandler;
}
