import { ActionCommandReceiver, CombatActionReplayTreePayload } from "@speed-dungeon/common";
import { battleResultActionCommandHandler } from "./process-battle-result";
import gameMessageActionCommandHandler from "./game-message";
import { removeClientPlayerFromGame } from "./remove-client-player-from-game";
import { getGameWorld } from "../3d-world/SceneManager";
import { baseMenuState, useGameStore } from "@/stores/game-store";
import { synchronizeTargetingIndicators } from "../websocket-manager/game-event-handlers/synchronize-targeting-indicators";
import { MenuStateType } from "../game/ActionMenu/menu-state";

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

        getGameWorld().replayTreeManager.enqueueTree(payload, () => resolve(true));
      });
      await promise;
    };

  removePlayerFromGameCommandHandler = removeClientPlayerFromGame;
  battleResultActionCommandHandler = battleResultActionCommandHandler;
  gameMessageCommandHandler = gameMessageActionCommandHandler;
}
