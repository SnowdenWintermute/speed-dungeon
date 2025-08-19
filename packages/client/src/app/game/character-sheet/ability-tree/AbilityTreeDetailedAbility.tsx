import Divider from "@/app/components/atoms/Divider";
import { useGameStore } from "@/stores/game-store";
import {
  AbilityType,
  COMBAT_ACTION_USABLITY_CONTEXT_STRINGS,
  CombatActionResourceChangeProperties,
  CombatantProperties,
  EQUIPMENT_TYPE_STRINGS,
  HOLDABLE_SLOT_STRINGS,
  ResourceChange,
  TARGETING_SCHEME_STRINGS,
  TARGET_CATEGORY_STRINGS,
  createArrayFilledWithSequentialNumbers,
  getAbilityTreeAbilityNameString,
} from "@speed-dungeon/common";
import React from "react";
import { COMBAT_ACTION_DESCRIPTIONS } from "./ability-descriptions";
import { ActionDescription, ActionDescriptionComponent } from "./ability-description";
import { formatActionAccuracy } from "@speed-dungeon/common/src/combat/combat-actions/combat-action-accuracy";
import DamageTypeBadge from "../../detailables/DamageTypeBadge";

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
    <div className="max-h-full flex flex-col">
      <div className="flex-grow-0 flex-shrink">
        <h3 className="text-lg">{abilityNameString}</h3>
        <Divider />
      </div>
      <div className="overflow-y-auto flex-1">{descriptionDisplay}</div>
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
        const canBeBlocked = description[ActionDescriptionComponent.IsBlockable];
        const canBeCountered = description[ActionDescriptionComponent.IsCounterable];
        const canBeParried = description[ActionDescriptionComponent.IsParryable];
        const resourceChangePropertiesOption =
          description[ActionDescriptionComponent.ResourceChanges];

        const addsHotswapPropertiesOption =
          description[ActionDescriptionComponent.AddsPropertiesFromHoldableSlot];

        const useableWithEquipmentTypesOption =
          description[ActionDescriptionComponent.UsableWithEquipmentTypes];

        const allowedMitigations = [];
        const prohibitedMitigations = [];
        if (typeof canBeBlocked === "boolean") {
          if (canBeBlocked) allowedMitigations.push("blocked");
          else prohibitedMitigations.push("blocked");
        }
        if (typeof canBeParried === "boolean") {
          if (canBeParried) allowedMitigations.push("parried");
          else prohibitedMitigations.push("parried");
        }
        if (typeof canBeCountered === "boolean") {
          if (canBeCountered) allowedMitigations.push("countered");
          else prohibitedMitigations.push("countered");
        }

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
              <div>
                Crit chance / multiplier: {description[ActionDescriptionComponent.CritChance]}%
                <span> / </span>
                {description[ActionDescriptionComponent.CritMultiplier]}%
              </div>
            )}
            {allowedMitigations.length ? <div>Can be {allowedMitigations.join(", ")}</div> : ""}
            {prohibitedMitigations.length ? (
              <div>Can NOT be {prohibitedMitigations.join(", ")}</div>
            ) : (
              ""
            )}
            {typeof addsHotswapPropertiesOption === "number" && (
              <div>
                Adds properties from {HOLDABLE_SLOT_STRINGS[addsHotswapPropertiesOption]} equipment
              </div>
            )}
            {!!useableWithEquipmentTypesOption?.length && <div>Requires {useableWithEquipmentTypesOption.map((item) => EQUIPMENT_TYPE_STRINGS[item]).join(", ").toLowerCase()}</div>}
            {resourceChangePropertiesOption && (
              <ul className="mt-1">
                {resourceChangePropertiesOption
                  .filter((item) => item.changeProperties !== null)
                  .map((item, i) => (
                    <ResourceChangeDisplay
                      key={i}
                      resourceChangeProperties={item.changeProperties!}
                    />
                  ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ResourceChangeDisplay({
  resourceChangeProperties,
}: {
  resourceChangeProperties: CombatActionResourceChangeProperties;
}) {
  return (
    <div className="flex">
      <span className="mr-1">{`${resourceChangeProperties.baseValues.min}-${resourceChangeProperties.baseValues.max}`}</span>
      <DamageTypeBadge hpChangeSource={resourceChangeProperties.resourceChangeSource} />
      <span className="ml-1">
        {resourceChangeProperties.resourceChangeSource.isHealing ? "healing" : "damage"}
      </span>
    </div>
  );
}
