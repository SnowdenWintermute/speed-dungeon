import Divider from "@/app/components/atoms/Divider";
import { useGameStore } from "@/stores/game-store";
import { getAbilityTreeAbilityNameString } from "@speed-dungeon/common";
import React from "react";

export default function AbilityTreeDetailedAbility() {
  const hoveredAbility = useGameStore().hoveredCombatantAbility;
  const detailedAbility = useGameStore().detailedCombatantAbility;

  let abilityNameString = "Select an ability";
  if (hoveredAbility !== null) {
    abilityNameString = getAbilityTreeAbilityNameString(hoveredAbility);
  } else if (detailedAbility !== null) {
    abilityNameString = getAbilityTreeAbilityNameString(detailedAbility);
  }

  return (
    <div>
      <h3 className="text-lg">{abilityNameString}</h3>
      <Divider />
      <div>Text here</div>
    </div>
  );
}
