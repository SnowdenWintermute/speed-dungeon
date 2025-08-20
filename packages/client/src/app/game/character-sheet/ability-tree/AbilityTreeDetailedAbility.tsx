import Divider from "@/app/components/atoms/Divider";
import { useGameStore } from "@/stores/game-store";
import {
  AbilityType,
  COMBATANT_TRAIT_DESCRIPTIONS,
  Combatant,
  getAbilityTreeAbilityNameString,
} from "@speed-dungeon/common";
import React from "react";
import { COMBAT_ACTION_DESCRIPTIONS } from "./ability-descriptions";
import ActionDescriptionDisplay from "./ActionDescriptionDisplay";
import TraitDescriptionDisplay from "./TraitDescriptionDisplay";

export default function AbilityTreeDetailedAbility({ user }: { user: Combatant }) {
  const detailedAbility = useGameStore().detailedCombatantAbility;
  const hoveredCombatantAbility = useGameStore().hoveredCombatantAbility;
  const ability = hoveredCombatantAbility || detailedAbility || null;

  let abilityNameString = "Select an ability";
  let descriptionDisplay = null;
  if (ability !== null) {
    abilityNameString = getAbilityTreeAbilityNameString(ability);
    if (ability.type === AbilityType.Action) {
      const description = COMBAT_ACTION_DESCRIPTIONS[ability.actionName];
      descriptionDisplay = <ActionDescriptionDisplay description={description} user={user} />;
    } else {
      const description = COMBATANT_TRAIT_DESCRIPTIONS[ability.traitType];
      descriptionDisplay = (
        <TraitDescriptionDisplay
          user={user}
          traitType={ability.traitType}
          description={description}
        />
      );
    }
  }

  return (
    <div className="max-h-full flex flex-col">
      <div className="flex-grow-0 flex-shrink">
        <h3 className="text-lg">{abilityNameString}</h3>
        <Divider />
      </div>
      <div className="overflow-y-auto flex-1">{descriptionDisplay}</div>
    </div>
  );
}
