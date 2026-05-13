import { ClientIntentType, CombatActionName } from "@speed-dungeon/common";
import { ClientApplication } from "../../";
import { ActionMenuScreenType } from "../screen-types";
import { ActionMenuScreen } from ".";
import {
  ActionMenuTopSectionItem,
  ActionMenuTopSectionItemType,
  ActionMenuCentralSection,
  ActionMenuCentralSectionType,
  ActionMenuBottomSection,
  ActionMenuBottomSectionType,
} from "../action-menu-display-data";

export class ConsideringCombatActionMenuScreen extends ActionMenuScreen {
  constructor(
    clientApplication: ClientApplication,
    public combatActionName: CombatActionName
  ) {
    super(clientApplication, ActionMenuScreenType.CombatActionSelected);
  }

  getTopSection(): ActionMenuTopSectionItem[] {
    return [
      {
        type: ActionMenuTopSectionItemType.GoBack,
        data: {
          extraFn: () => {
            this.clientApplication.gameClientRef.get().dispatchIntent({
              type: ClientIntentType.SelectCombatAction,
              data: {
                characterId: this.clientApplication.combatantFocus.requireFocusedCharacterId(),
                actionAndRankOption: null,
              },
            });
          },
        },
      },
      { type: ActionMenuTopSectionItemType.ExecuteCombatAction, data: undefined },
      { type: ActionMenuTopSectionItemType.CycleTargetingSchemes, data: undefined },
    ];
  }

  getCentralSection(): ActionMenuCentralSection {
    return {
      type: ActionMenuCentralSectionType.CombatActionDetail,
      data: { actionName: this.combatActionName },
    };
  }

  getBottomSection(): ActionMenuBottomSection {
    return { type: ActionMenuBottomSectionType.CycleCombatActionTargets, data: undefined };
  }
}
