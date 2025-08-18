import Divider from "@/app/components/atoms/Divider";
import { useGameStore } from "@/stores/game-store";
import {
  AbilityType,
  COMBAT_ACTION_USABLITY_CONTEXT_STRINGS,
  CombatantProperties,
  TARGETING_SCHEME_STRINGS,
  TARGET_CATEGORY_STRINGS,
  createArrayFilledWithSequentialNumbers,
  getAbilityTreeAbilityNameString,
} from "@speed-dungeon/common";
import React from "react";
import { COMBAT_ACTION_DESCRIPTIONS } from "./ability-descriptions";
import { ActionDescription, ActionDescriptionComponent } from "./ability-description";

export default function AbilityTreeDetailedAbility({ user }: { user: CombatantProperties }) {
  const detailedAbility = useGameStore().detailedCombatantAbility;
  const hoveredCombatantAbility = useGameStore().hoveredCombatantAbility;
  const ability = hoveredCombatantAbility || detailedAbility || null;

  let abilityNameString = "Select an ability";
  let description = null;
  if (ability !== null) {
    abilityNameString = getAbilityTreeAbilityNameString(ability);
    if (ability.type === AbilityType.Action)
      description = COMBAT_ACTION_DESCRIPTIONS[ability.actionName];
  }

  let descriptionDisplay = null;
  if (description !== null)
    descriptionDisplay = <ActionDescriptionDisplay description={description} user={user} />;

  return (
    <div>
      <h3 className="text-lg">{abilityNameString}</h3>
      <Divider />
      <div>{descriptionDisplay}</div>
    </div>
  );
}

function ActionDescriptionDisplay({
  description,
  user,
}: {
  description: ActionDescription;
  user: CombatantProperties;
}) {
  const descriptions = [];
  let prevDescription = {};
  for (const actionRank of createArrayFilledWithSequentialNumbers(3, 1)) {
    const rankDescription = description.getDescriptionByLevel(user, actionRank);

    const diff = ActionDescription.getDiff<Partial<typeof rankDescription>>(
      prevDescription,
      rankDescription
    );
    descriptions.push(diff);

    prevDescription = rankDescription;
  }

  return (
    <div>
      <div>{description.getSummary()}</div>
      <div>Usable {COMBAT_ACTION_USABLITY_CONTEXT_STRINGS[description.getUsabilityContext()]}</div>

      <Divider />

      {
        descriptions.map((description, index) => {
          return (
            <div key={"description-" + index} className="mb-2">
              <div className="text-lg">Rank {index + 1}</div>
              {description[ActionDescriptionComponent.TargetingSchemes] && (
                <div>
                  Targeting schemes:{" "}
                  {description[ActionDescriptionComponent.TargetingSchemes]
                    .map((scheme) => TARGETING_SCHEME_STRINGS[scheme])
                    .join(", ")}
                </div>
              )}
            </div>
          );
        })
        // <div>
        // Targeting scheme:{" "}
        // {description.getTargetingSchemes(1).map((scheme) => TARGETING_SCHEME_STRINGS[scheme])}
        // </div>
        // <div>Can target: {TARGET_CATEGORY_STRINGS[description.getTargetableGroups(1)]}</div>
        // <div></div>
      }
    </div>
  );
}
