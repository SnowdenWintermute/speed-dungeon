import { GameState } from "@/stores/game-store";
import {
  ActionButtonCategory,
  ActionButtonsByCategory,
  ActionMenuButtonProperties,
  ActionMenuState,
  MenuStateType,
} from ".";
import { UIState } from "@/stores/ui-store";
import { AlertState } from "@/stores/alert-store";
import { Item } from "@speed-dungeon/common";

export class ConsideringItemMenuState implements ActionMenuState {
  page = 0;
  type = MenuStateType.BaseOutOfCombat;
  constructor(
    public gameState: GameState,
    public uiState: UIState,
    public alertState: AlertState,
    public item: Item
  ) {}
  getButtonProperties(): ActionButtonsByCategory {
    const toReturn = new ActionButtonsByCategory();

    const cancelButton = new ActionMenuButtonProperties("Cancel", () => {
      this.gameState.mutateState((state) => {
        state.stackedMenuStates.pop();
      });
    });

    cancelButton.dedicatedKeys = ["Escape"];
    toReturn[ActionButtonCategory.Top].push(cancelButton);

    // addAbilityGameActionsToList(gameActions, abilities);
    // gameActions.push({
    //   type: GameActionType.SetAssignAttributePointsMenuOpen,
    //   shouldBeOpen: true,
    // });
    return toReturn;
  }
}
