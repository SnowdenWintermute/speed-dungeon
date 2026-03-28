import React from "react";
import { observer } from "mobx-react-lite";
import { ListCyclingButtons } from "./ListCyclingButtons";
import { AbilityUtils, NextOrPrevious, getNextOrPreviousNumber } from "@speed-dungeon/common";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { ConsideringCombatantAbilityActionMenuScreen } from "@/client-application/action-menu/screens/ability-tree-ability";

interface Props {
  menuState: ConsideringCombatantAbilityActionMenuScreen;
}

export const CycleConsideredAbilityInTreeColumnButtons = observer((props: Props) => {
  const { menuState } = props;
  const currentPageIndex = menuState.column.findIndex((item) =>
    AbilityUtils.abilitiesAreEqual(menuState.ability, item)
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
    const clientApplication = useClientApplication();
    const { detailableEntityFocus } = clientApplication;
    detailableEntityFocus.combatantAbilities.setDetailed(newDetailedAbilityOption);

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
