import React from "react";
import { observer } from "mobx-react-lite";
import { ListCyclingButtons } from "./ListCyclingButtons";
import { ConsideringCombatantAbilityMenuState } from "../considering-tree-ability";
import {
  NextOrPrevious,
  abilityTreeAbilitiesAreEqual,
  getNextOrPreviousNumber,
} from "@speed-dungeon/common";
import { AppStore } from "@/mobx-stores/app-store";

interface Props {
  menuState: ConsideringCombatantAbilityMenuState;
}

export const CycleConsideredAbilityInTreeColumnButtons = observer((props: Props) => {
  const { menuState } = props;
  const currentPageIndex = menuState.column.findIndex((item) =>
    abilityTreeAbilitiesAreEqual(menuState.ability, item)
  );

  const abilitiesInRowCount = menuState.column.length;

  function onCycle(direction: NextOrPrevious) {
    const newDetailedAbilityIndex = getNextOrPreviousNumber(
      currentPageIndex,
      abilitiesInRowCount - 1,
      direction,
      { minNumber: 0 }
    );

    const newDetailedAbilityOption = menuState.column[newDetailedAbilityIndex];

    if (newDetailedAbilityOption === undefined) {
      throw new Error("Expected to have a valid ability here");
    }

    AppStore.get().focusStore.combatantAbilities.setDetailed(newDetailedAbilityOption);

    menuState.setAbility(newDetailedAbilityOption);
  }

  return (
    <ListCyclingButtons
      onCycle={onCycle}
      itemCount={abilitiesInRowCount}
      currentIndex={currentPageIndex}
      listTitle={"Row"}
    />
  );
});
