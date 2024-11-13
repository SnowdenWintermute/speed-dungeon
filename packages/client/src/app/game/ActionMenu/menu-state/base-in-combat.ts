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
  page = 1;
  type = MenuStateType.BaseOutOfCombat;
  numPages: number = 1;
  constructor() {}
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
