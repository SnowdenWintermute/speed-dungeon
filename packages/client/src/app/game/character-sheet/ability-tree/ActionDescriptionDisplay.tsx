import {
  CombatActionResourceChangeProperties,
  Combatant,
  COMBATANT_CLASS_NAME_STRINGS,
  COMBATANT_CONDITION_NAME_STRINGS,
  CombatantAbilityProperties,
  CombatantProperties,
  createArrayFilledWithSequentialNumbers,
  EQUIPMENT_TYPE_STRINGS,
  HOLDABLE_SLOT_STRINGS,
  iterateNumericEnumKeyedRecord,
  TARGET_CATEGORY_STRINGS,
  TARGETING_SCHEME_STRINGS,
  THREAT_TYPE_STRINGS,
} from "@speed-dungeon/common";
import { ActionDescription, ActionDescriptionComponent } from "./action-description";
import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client_consts";
import { formatActionAccuracy } from "@speed-dungeon/common";
import DamageTypeBadge from "../../detailables/DamageTypeBadge";

export default function ActionDescriptionDisplay({
  description,
  user,
}: {
  description: ActionDescription;
  user: Combatant;
}) {
  const descriptions = [];
  let prevDescription = {};

  const { combatantClass } = description.getClassAndLevelRequirements(1);

  const isSupportClassAbility =
    combatantClass === user.combatantProperties.supportClassProperties?.combatantClass;

  // @TODO - replace "3" with the action's max rank
  const maxRank = isSupportClassAbility ? 2 : 3;

  for (const actionRank of createArrayFilledWithSequentialNumbers(maxRank, 1)) {
    const rankDescription = description.getDescriptionByLevel(user, actionRank);

    const diff = ActionDescription.getDiff<Partial<typeof rankDescription>>(
      prevDescription,
      rankDescription
    );
    descriptions.push(diff);

    prevDescription = rankDescription;
  }

  const ownedAbilityLevel = CombatantAbilityProperties.getAbilityLevel(
    user.combatantProperties,
    description.ability
  );

  return (
    <div>
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

        const appliedConditionsOption =
          description[ActionDescriptionComponent.AppliesConditions] || null;

        const useableWithEquipmentTypesOption =
          description[ActionDescriptionComponent.UsableWithEquipmentTypes];

        const classAndLevelRequirements =
          description[ActionDescriptionComponent.ClassAndLevelRequirements];

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

        const flatThreatOption = description[ActionDescriptionComponent.FlatThreatGenerated];

        const thisRankOwned = ownedAbilityLevel >= index + 1;

        return (
          <div
            key={"description-" + index}
            className={`mb-2 ${thisRankOwned ? "" : "text-gray-400"}`}
          >
            <div className={`flex justify-between text-lg `}>
              <div className=" underline-offset-4 underline">Rank {index + 1}</div>
              {classAndLevelRequirements && (
                <div
                  className={
                    CombatantProperties.meetsCombatantClassAndLevelRequirements(
                      user.combatantProperties,
                      classAndLevelRequirements.combatantClass,
                      classAndLevelRequirements.level
                    )
                      ? ""
                      : UNMET_REQUIREMENT_TEXT_COLOR
                  }
                >
                  ({COMBATANT_CLASS_NAME_STRINGS[classAndLevelRequirements.combatantClass]}
                  {" level "}
                  {classAndLevelRequirements?.level})
                </div>
              )}
            </div>
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
              <div>
                Uses {Math.abs(actionPointCostOption)} action point
                {Math.abs(actionPointCostOption) > 1 ? "s" : ""}
              </div>
            )}

            {typeof description[ActionDescriptionComponent.ManaCost] === "number" && (
              <div>Costs {Math.abs(description[ActionDescriptionComponent.ManaCost])} mana</div>
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
            {
              // allowedMitigations.length ? <div>Can be {allowedMitigations.join(", ")}</div> : ""
            }
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
            {flatThreatOption && (
              <div>
                Generates{" "}
                {iterateNumericEnumKeyedRecord(flatThreatOption)
                  .map(
                    ([threatType, number]) =>
                      `${number} ${THREAT_TYPE_STRINGS[threatType].toLowerCase()}`
                  )
                  .join("/")}{" "}
                threat
              </div>
            )}
            {!!useableWithEquipmentTypesOption?.length && (
              <div>
                Requires{" "}
                {useableWithEquipmentTypesOption
                  .map((item) => EQUIPMENT_TYPE_STRINGS[item])
                  .join(", ")
                  .toLowerCase()}
              </div>
            )}
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
            {appliedConditionsOption && (
              <div>
                Applies{" "}
                {appliedConditionsOption.map((condition) => (
                  <span key={condition.conditionName}>
                    {condition.stacks > 1 && `${condition.stacks} stacks of `}
                    {COMBATANT_CONDITION_NAME_STRINGS[condition.conditionName]} rank{" "}
                    {condition.level}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ResourceChangeDisplay({
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
