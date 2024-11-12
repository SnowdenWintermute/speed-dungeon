import { GameState, inventoryItemsMenuState } from "@/stores/game-store";
import {
  ActionButtonCategory,
  ActionButtonsByCategory,
  ActionMenuButtonProperties,
  ActionMenuState,
  MenuStateType,
} from ".";
import { UIState } from "@/stores/ui-store";
import { AlertState } from "@/stores/alert-store";
import { ClientToServerEvent } from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";

export class BaseOutOfCombatMenuState implements ActionMenuState {
  page = 1;
  numPages: number = 1;
  type = MenuStateType.BaseOutOfCombat;
  constructor(
    public gameState: GameState,
    public uiState: UIState,
    public alertState: AlertState
  ) {}
  getButtonProperties(): ActionButtonsByCategory {
    const toReturn = new ActionButtonsByCategory();

    const setInventoryOpen = new ActionMenuButtonProperties("Open Inventory", () => {
      this.gameState.mutateState((state) => {
        state.menuState = inventoryItemsMenuState;
      });
    });
    setInventoryOpen.dedicatedKeys = ["KeyI", "KeyS"];
    toReturn[ActionButtonCategory.Top].push(setInventoryOpen);

    const toggleReadyToExplore = new ActionMenuButtonProperties("Ready to explore", () => {
      websocketConnection.emit(ClientToServerEvent.ToggleReadyToExplore);
    });
    toReturn[ActionButtonCategory.Numbered].push(toggleReadyToExplore);

    // addAbilityGameActionsToList(gameActions, abilities);
    // gameActions.push({
    //   type: GameActionType.SetAssignAttributePointsMenuOpen,
    //   shouldBeOpen: true,
    // });
    return toReturn;
  }
}
