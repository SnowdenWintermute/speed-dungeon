import { AbilityTreeAbility } from "@speed-dungeon/common";
import makeAutoObservable from "mobx-store-inheritance";
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

export class ConsideringCombatantAbilityActionMenuScreen extends ActionMenuScreen {
  constructor(
    clientApplication: ClientApplication,
    public column: AbilityTreeAbility[],
    public ability: AbilityTreeAbility
  ) {
    super(clientApplication, ActionMenuScreenType.ConsideringAbilityTreeAbility);
    this.minPageCount = column.length;
    makeAutoObservable(this);
  }

  getTopSection(): ActionMenuTopSectionItem[] {
    return [
      {
        type: ActionMenuTopSectionItemType.GoBack,
        data: {
          extraFn: () => {
            this.clientApplication.detailableEntityFocus.combatantAbilities.clearDetailed();
          },
        },
      },
      {
        type: ActionMenuTopSectionItemType.AllocateAbilityPoint,
        data: { ability: this.ability },
      },
    ];
  }

  getCentralSection(): ActionMenuCentralSection {
    return {
      type: ActionMenuCentralSectionType.AbilityDetail,
      data: { ability: this.ability, column: this.column },
    };
  }

  getBottomSection(): ActionMenuBottomSection {
    return {
      type: ActionMenuBottomSectionType.CycleConsideredAbilityInTreeColumn,
      data: { screen: this },
    };
  }

  setAbility(abilityTreeAbility: AbilityTreeAbility) {
    this.ability = abilityTreeAbility;
  }
}
