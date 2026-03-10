import { getGameWorldView } from "@/app/game-world-view-canvas/SceneManager";
import { MenuStateType } from "@/app/game/ActionMenu/menu-state/menu-state-type";
import { AppStore } from "@/mobx-stores/app-store";
import {
  ActionCommandReceiver,
  CombatActionReplayTreePayload,
  CombatantId,
} from "@speed-dungeon/common";
import { battleResultActionCommandHandler } from "./process-battle-result";
import { removeClientPlayerFromGame } from "./remove-client-player-from-game";
import { gameMessageActionCommandHandler } from "./game-message";

export class ClientActionCommandReceiver implements ActionCommandReceiver {
  combatActionReplayTreeHandler: (payload: CombatActionReplayTreePayload) => Promise<void | Error> =
    async (payload) => {
      const promise = new Promise((resolve, reject) => {
        const { actionMenuStore } = AppStore.get();

        AppStore.get().targetIndicatorStore.clearUserTargets(payload.actionUserId);

        const player = AppStore.get().gameStore.getExpectedClientPlayer();
        if (player.characterIds.includes(payload.actionUserId as CombatantId)) {
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

        getGameWorldView().replayTreeManager.enqueueTree(
          payload.root,
          !!payload.doNotLockInput,
          () => resolve(true)
        );
      });

      await promise;
    };

  removePlayerFromGameCommandHandler = removeClientPlayerFromGame;
  battleResultActionCommandHandler = battleResultActionCommandHandler;
  gameMessageCommandHandler = gameMessageActionCommandHandler;
}
