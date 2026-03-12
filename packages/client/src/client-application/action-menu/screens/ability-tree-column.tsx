import { ActionMenuScreen } from ".";
import {
  ABILITY_TREES,
  ABILITY_TREE_DIMENSIONS,
  EMPTY_ABILITY_TREE,
  getAbilityTreeAbilityNameString,
} from "@speed-dungeon/common";
import React, { ReactNode } from "react";
import makeAutoObservable from "mobx-store-inheritance";
import { ClientApplication } from "../..";
import { ActionMenuScreenType } from "../screen-types";
import GoBackButton from "@/app/game/ActionMenu/menu-state/common-buttons/GoBackButton";
import { getAbilityIcon } from "@/app/game/character-sheet/ability-tree/ability-icons";
import AbilityTreeAbilityButton from "@/app/game/ActionMenu/menu-state/common-buttons/AbilityTreeAbilityButton";

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

  getTopSection() {
    return (
      <ul className="flex">
        <GoBackButton />
      </ul>
    );
  }

  getNumberedButtons() {
    const focusedCharacter = this.clientApplication.combatantFocus.requireFocusedCharacter();

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
