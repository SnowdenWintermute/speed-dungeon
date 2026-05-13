import Divider from "@/app/components/atoms/Divider";
import {
  AbilityType,
  COMBATANT_TRAIT_DESCRIPTIONS,
  Combatant,
  getAbilityTreeAbilityNameString,
} from "@speed-dungeon/common";
import React from "react";
import { COMBAT_ACTION_DESCRIPTIONS } from "./ability-descriptions";
import { ActionDescriptionDisplay } from "./ActionDescriptionDisplay";
import TraitDescriptionDisplay from "./TraitDescriptionDisplay";
import { observer } from "mobx-react-lite";
import { useClientApplication } from "@/hooks/create-client-application-context";

export const AbilityTreeDetailedAbility = observer(({ user }: { user: Combatant }) => {
  const clientApplication = useClientApplication();
  const { gameContext, detailableEntityFocus } = clientApplication;
  const party = gameContext.requireParty();
  const focusedAbility = detailableEntityFocus.combatantAbilities.get();
  const { detailed: detailedAbility, hovered: hoveredCombatantAbility } = focusedAbility;
  const ability = hoveredCombatantAbility || detailedAbility || null;

  let abilityNameString = "Select an ability";
  let descriptionDisplay = null;
  if (ability !== null) {
    abilityNameString = getAbilityTreeAbilityNameString(ability);
    if (ability.type === AbilityType.Action) {
      const description = COMBAT_ACTION_DESCRIPTIONS[ability.actionName];

      const ownedAbilityLevel = user.combatantProperties.abilityProperties.getAbilityRank(
        description.ability
      );
      descriptionDisplay = (
        <ActionDescriptionDisplay
          description={description}
          user={user}
          party={party}
          ownedAbilityLevel={ownedAbilityLevel}
        />
      );
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
    <div className="max-h-full flex flex-col pointer-events-auto">
      <div className="flex-grow-0 flex-shrink">
        <h3 className="text-lg">{abilityNameString}</h3>
        <Divider />
      </div>
      <div className="overflow-y-auto flex-1">{descriptionDisplay}</div>
    </div>
  );
});
