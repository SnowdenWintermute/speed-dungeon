import { ActionCommandReceiver, CombatActionReplayTreePayload } from "@speed-dungeon/common";
import { battleResultActionCommandHandler } from "./process-battle-result";
import { gameMessageActionCommandHandler } from "./game-message";
import { removeClientPlayerFromGame } from "./remove-client-player-from-game";
import { getGameWorld } from "../3d-world/SceneManager";
import { AppStore } from "@/mobx-stores/app-store";
import { MenuStateType } from "../game/ActionMenu/menu-state/menu-state-type";

export class ClientActionCommandReceiver implements ActionCommandReceiver {
  constructor() {}
  combatActionReplayTreeHandler: (payload: CombatActionReplayTreePayload) => Promise<void | Error> =
    async (payload) => {
      const promise = new Promise((resolve, reject) => {
        const { actionMenuStore } = AppStore.get();

        AppStore.get().targetIndicatorStore.clearUserTargets(payload.actionUserId);

        const player = AppStore.get().gameStore.getExpectedClientPlayer();
        if (player.characterIds.includes(payload.actionUserId)) {
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

        getGameWorld().replayTreeManager.enqueueTree(payload, () => resolve(true));
      });

      await promise;
    };

  removePlayerFromGameCommandHandler = removeClientPlayerFromGame;
  battleResultActionCommandHandler = battleResultActionCommandHandler;
  gameMessageCommandHandler = gameMessageActionCommandHandler;
}
