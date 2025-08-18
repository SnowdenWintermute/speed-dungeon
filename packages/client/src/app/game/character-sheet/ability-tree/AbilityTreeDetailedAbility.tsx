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
import { formatActionAccuracy } from "@speed-dungeon/common/src/combat/combat-actions/combat-action-accuracy";

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

      {descriptions.map((description, index) => {
        const cooldownOption = description[ActionDescriptionComponent.Cooldown];
        const requiresTurnOption = description[ActionDescriptionComponent.RequiresTurn];
        const actionPointCostOption = description[ActionDescriptionComponent.ActionPointCost];

        return (
          <div key={"description-" + index} className="mb-2">
            <div className="text-lg underline-offset-4 underline">Rank {index + 1}</div>
            {description[ActionDescriptionComponent.TargetingSchemes] && (
              <div>
                Targeting schemes:{" "}
                {description[ActionDescriptionComponent.TargetingSchemes]
                  .map((scheme) => TARGETING_SCHEME_STRINGS[scheme])
                  .join(", ")}
              </div>
            )}
            {description[ActionDescriptionComponent.TargetableGroups] !== undefined && (
              <div>
                Can target:{" "}
                {TARGET_CATEGORY_STRINGS[description[ActionDescriptionComponent.TargetableGroups]]}
              </div>
            )}
            {typeof actionPointCostOption === "number" && (
              <div>{Math.abs(actionPointCostOption)} action points</div>
            )}

            {typeof description[ActionDescriptionComponent.ManaCost] === "number" && (
              <div>{Math.abs(description[ActionDescriptionComponent.ManaCost])} mana</div>
            )}
            {typeof description[ActionDescriptionComponent.HitPointCost] === "number" && (
              <div>{Math.abs(description[ActionDescriptionComponent.HitPointCost])} hit points</div>
            )}
            {typeof description[ActionDescriptionComponent.ShardCost] === "number" && (
              <div>{Math.abs(description[ActionDescriptionComponent.ShardCost])} shards</div>
            )}
            {typeof requiresTurnOption === "boolean" && requiresTurnOption && (
              <div>Ends turn on use</div>
            )}
            {typeof cooldownOption === "number" && (
              <div>
                Cooldown: {cooldownOption} turn{cooldownOption > 1 ? "s" : ""}
              </div>
            )}
            {description[ActionDescriptionComponent.Accuracy] && (
              <div>
                Accuracy: {formatActionAccuracy(description[ActionDescriptionComponent.Accuracy])}
              </div>
            )}
            {typeof description[ActionDescriptionComponent.CritChance] === "number" && (
              <div>Crit chance: {description[ActionDescriptionComponent.CritChance]}%</div>
            )}
            {typeof description[ActionDescriptionComponent.CritMultiplier] === "number" && (
              <div>Crit multiplier: {description[ActionDescriptionComponent.CritMultiplier]}%</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
