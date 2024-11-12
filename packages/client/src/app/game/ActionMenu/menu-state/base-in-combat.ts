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

export class InCombatMenuState implements ActionMenuState {
  type = MenuStateType.BaseOutOfCombat;
  constructor(
    public gameState: GameState,
    public uiState: UIState,
    public alertState: AlertState
    // public setState: React.Dispatch<Sta
  ) {}
  getButtonProperties(): ActionButtonsByCategory {
    const toReturn = new ActionButtonsByCategory();

    const inCombatButton = new ActionMenuButtonProperties("In combat button", () => {});
    inCombatButton.dedicatedKeys = ["KeyI", "KeyS"];
    toReturn[ActionButtonCategory.Top].push(inCombatButton);

    // addAbilityGameActionsToList(gameActions, abilities);
    // gameActions.push({
    //   type: GameActionType.SetAssignAttributePointsMenuOpen,
    //   shouldBeOpen: true,
    // });
    return toReturn;
  }
}
