import { ActionCommandReceiver, CombatActionReplayTreePayload } from "@speed-dungeon/common";
import { battleResultActionCommandHandler } from "./process-battle-result";
import gameMessageActionCommandHandler from "./game-message";
import { removeClientPlayerFromGame } from "./remove-client-player-from-game";
import { getGameWorld } from "../3d-world/SceneManager";
import { useGameStore } from "@/stores/game-store";
import { synchronizeTargetingIndicators } from "../websocket-manager/game-event-handlers/synchronize-targeting-indicators";
import { MenuStateType } from "../game/ActionMenu/menu-state";
import { AppStore } from "@/mobx-stores/app-store";

export class ClientActionCommandReceiver implements ActionCommandReceiver {
  constructor() {}
  combatActionReplayTreeHandler: (payload: CombatActionReplayTreePayload) => Promise<void | Error> =
    async (payload) => {
      const promise = new Promise((resolve, reject) => {
        const { actionMenuStore } = AppStore.get();

        useGameStore.getState().mutateState((state) => {
          synchronizeTargetingIndicators(state, null, payload.actionUserId, []);

          const playerResult = state.getPlayer();
          if (playerResult instanceof Error) throw playerResult;
          if (playerResult.characterIds.includes(payload.actionUserId)) {
            const inventoryIsOpen = actionMenuStore.stackedMenusIncludeType(
              MenuStateType.InventoryItems
            );
            if (inventoryIsOpen) {
              let currentMenu = actionMenuStore.getCurrentMenu();
              while (
                currentMenu.type !== MenuStateType.InventoryItems &&
                currentMenu.type !== MenuStateType.Base
              ) {
                actionMenuStore.popStack();
                currentMenu = actionMenuStore.getCurrentMenu();
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
