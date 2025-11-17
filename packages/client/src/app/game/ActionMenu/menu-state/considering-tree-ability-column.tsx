import { ActionMenuState } from ".";
import {
  ABILITY_TREES,
  ABILITY_TREE_DIMENSIONS,
  EMPTY_ABILITY_TREE,
  getAbilityTreeAbilityNameString,
} from "@speed-dungeon/common";
import { ReactNode } from "react";
import { getAbilityIcon } from "../../character-sheet/ability-tree/ability-icons";
import { AppStore } from "@/mobx-stores/app-store";
import { MenuStateType } from "./menu-state-type";
import GoBackButton from "./common-buttons/GoBackButton";
import AbilityTreeAbilityButton from "./common-buttons/AbilityTreeAbilityButton";
import makeAutoObservable from "mobx-store-inheritance";

export class ConsideringAbilityTreeColumnMenuState extends ActionMenuState {
  constructor(public readonly columnIndex: number) {
    super(MenuStateType.ConsideringAbilityTreeColumn);
    this.minPageCount = ABILITY_TREE_DIMENSIONS.x;
    this.pageIndexInternal = columnIndex;
    makeAutoObservable(this);
  }

  getTopSection(): ReactNode {
    return (
      <ul className="flex">
        <GoBackButton />
      </ul>
    );
  }

  getNumberedButtons() {
    const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();

    const { combatantProperties } = focusedCharacter;
    const { classProgressionProperties } = combatantProperties;
    const mainClassProperties = classProgressionProperties.getMainClass();
    const supportClassProperties = classProgressionProperties.getSupportClassOption();

    const abilityTree = ABILITY_TREES[mainClassProperties.combatantClass];
    const subjobTree = supportClassProperties
      ? ABILITY_TREES[supportClassProperties.combatantClass]
      : EMPTY_ABILITY_TREE;

    const toReturn: ReactNode[] = [];

    abilityTree.columns.forEach((column, columnIndex) => {
      const subjobTreeColumn = subjobTree.columns[columnIndex] || [];
      const withSubjobAbilities = [...column, ...subjobTreeColumn.slice(0, 2)];

      // once we click on an ability we want to use page turning buttons to cycle through abilities
      // in that column and skip the buttons that we show in the empty spaces so we'll record the index
      let abilityButtonIndex = 0;
      toReturn.push(
        ...withSubjobAbilities.map((abilityOption, rowIndex) => {
          let nameAsString = undefined;
          let iconOption: ReactNode = <div />;

          if (abilityOption !== undefined) {
            nameAsString = getAbilityTreeAbilityNameString(abilityOption);
            const iconGetter = getAbilityIcon(abilityOption);
            iconOption = iconGetter ? iconGetter("h-full p-2 fill-slate-400") : "icon";
            abilityButtonIndex += 1;
          }

          return (
            <AbilityTreeAbilityButton
              key={columnIndex + rowIndex + (nameAsString || "")}
              abilityOption={abilityOption}
              rowIndex={rowIndex}
              abilityTreeColumn={column}
            />
          );
        })
      );
    });
    return toReturn;
  }
}
