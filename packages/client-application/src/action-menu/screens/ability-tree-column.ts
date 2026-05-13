import {
  ABILITY_TREES,
  ABILITY_TREE_DIMENSIONS,
  EMPTY_ABILITY_TREE,
} from "@speed-dungeon/common";
import makeAutoObservable from "mobx-store-inheritance";
import { ClientApplication } from "../../";
import { ActionMenuScreen } from ".";
import { ActionMenuScreenType } from "../screen-types";
import {
  ActionMenuTopSectionItem,
  ActionMenuTopSectionItemType,
  ActionMenuNumberedButtonDescriptor,
  ActionMenuNumberedButtonType,
} from "../action-menu-display-data";

export class ConsideringAbilityTreeColumnActionMenuScreen extends ActionMenuScreen {
  constructor(
    clientApplication: ClientApplication,
    public readonly columnIndex: number
  ) {
    super(clientApplication, ActionMenuScreenType.ConsideringAbilityTreeColumn);
    this.minPageCount = ABILITY_TREE_DIMENSIONS.x;
    this.pageIndexInternal = columnIndex;
    makeAutoObservable(this);
  }

  getTopSection(): ActionMenuTopSectionItem[] {
    return [{ type: ActionMenuTopSectionItemType.GoBack, data: {} }];
  }

  getNumberedButtons(): ActionMenuNumberedButtonDescriptor[] {
    const focusedCharacter = this.clientApplication.combatantFocus.requireFocusedCharacter();
    const { combatantProperties } = focusedCharacter;
    const { classProgressionProperties } = combatantProperties;
    const mainClassProperties = classProgressionProperties.getMainClass();
    const supportClassProperties = classProgressionProperties.getSupportClassOption();

    const abilityTree = ABILITY_TREES[mainClassProperties.combatantClass];
    const subjobTree = supportClassProperties
      ? ABILITY_TREES[supportClassProperties.combatantClass]
      : EMPTY_ABILITY_TREE;

    const buttons: ActionMenuNumberedButtonDescriptor[] = [];

    abilityTree.columns.forEach((column, columnIndex) => {
      const subjobTreeColumn = subjobTree.columns[columnIndex] || [];
      const withSubjobAbilities = [...column, ...subjobTreeColumn.slice(0, 2)];

      withSubjobAbilities.forEach((abilityOption, rowIndex) => {
        buttons.push({
          type: ActionMenuNumberedButtonType.AbilityTreeAbility as const,
          data: {
            abilityOption,
            rowIndex,
            abilityTreeColumn: column,
          },
        });
      });
    });

    return buttons;
  }
}
