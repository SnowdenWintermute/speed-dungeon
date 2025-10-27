import { Vector3 } from "@babylonjs/core";
import {
  AbilityTreeAbility,
  AbilityType,
  AbilityUtils,
  ActionPayableResource,
  ClassProgressionProperties,
  COMBAT_ACTION_NAME_STRINGS,
  CombatActionComponent,
  Combatant,
  CombatantClass,
  CombatantClassProperties,
  CombatantControllerType,
  CombatantProperties,
  CombatantSpecies,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import cloneDeep from "lodash.clonedeep";
import isEqual from "lodash.isequal";

export const TARGET_DUMMY_COMBATANT = Combatant.createInitialized(
  { name: "Target Dummy", id: "Target Dummy Entity Id" },
  new CombatantProperties(
    new ClassProgressionProperties(new CombatantClassProperties(1, CombatantClass.Warrior)),
    CombatantSpecies.Humanoid,
    null,
    { controllerType: CombatantControllerType.Dungeon, controllerName: "" },
    Vector3.Zero()
  )
);

export enum ActionDescriptionComponent {
  TargetingSchemes,
  TargetableGroups,
  Cooldown,
  RequiresTurn,
  ClassAndLevelRequirements,
  ByRankDescriptions,
  ShardCost,
  ManaCost,
  HitPointCost,
  ActionPointCost,
  Accuracy,
  CritChance,
  CritMultiplier,
  ArmorPenetration,
  IsParryable,
  IsBlockable,
  IsCounterable,
  ResourceChanges,
  AddsPropertiesFromHoldableSlot,
  UsableWithEquipmentTypes,
  AppliesConditions,
  FlatThreatGenerated,
}

export class ActionDescription {
  public ability: AbilityTreeAbility;
  constructor(private combatAction: CombatActionComponent) {
    this.ability = { type: AbilityType.Action, actionName: this.combatAction.name };
  }

  getName = () => COMBAT_ACTION_NAME_STRINGS[this.combatAction.name];
  getSummary = () => this.combatAction.description;
  getUsabilityContext() {
    return this.combatAction.targetingProperties.usabilityContext;
  }
  getClassAndLevelRequirements(abilityRank: number) {
    return AbilityUtils.getClassAndLevelRequirements(
      { type: AbilityType.Action, actionName: this.combatAction.name },
      abilityRank
    );
  }
  getByRankDescriptions(abilityRank: number) {
    return this.combatAction.byRankDescriptions[abilityRank] || null;
  }

  getFlatThreatGenerated(abilityRank: number) {
    return this.combatAction.hitOutcomeProperties.flatThreatGeneratedOnHit;
  }

  getDescriptionByLevel(user: Combatant, actionLevel: number) {
    const { combatantProperties } = user;
    const { hitOutcomeProperties, targetingProperties, costProperties } = this.combatAction;

    const resourceCosts = costProperties.getResourceCosts(user, true, actionLevel);

    const critChanceOption = this.combatAction.getCritChance(user, actionLevel);
    const critMultiplierOption = hitOutcomeProperties.getCritMultiplier(user, actionLevel);

    // const addsPropertiesFromHoldableSlot = hitOutcomeProperties.addsPropertiesFromHoldableSlot

    return {
      [ActionDescriptionComponent.TargetingSchemes]:
        targetingProperties.getTargetingSchemes(actionLevel),
      [ActionDescriptionComponent.TargetableGroups]:
        targetingProperties.getValidTargetCategories(actionLevel),
      [ActionDescriptionComponent.Cooldown]: costProperties.getCooldownTurns(user, actionLevel),
      [ActionDescriptionComponent.RequiresTurn]: costProperties.getEndsTurnOnUse(actionLevel),
      [ActionDescriptionComponent.ShardCost]: resourceCosts
        ? resourceCosts[ActionPayableResource.Shards]
        : null,
      [ActionDescriptionComponent.ManaCost]: resourceCosts
        ? resourceCosts[ActionPayableResource.Mana]
        : null,
      [ActionDescriptionComponent.HitPointCost]: resourceCosts
        ? resourceCosts[ActionPayableResource.HitPoints]
        : null,
      [ActionDescriptionComponent.ActionPointCost]: resourceCosts
        ? resourceCosts[ActionPayableResource.ActionPoints]
        : null,
      [ActionDescriptionComponent.Accuracy]: this.combatAction.getAccuracy(user, actionLevel),
      [ActionDescriptionComponent.CritChance]:
        critChanceOption !== null ? Math.floor(critChanceOption) : null,
      [ActionDescriptionComponent.CritMultiplier]:
        critMultiplierOption !== null ? Math.floor(critMultiplierOption * 100) : null,
      [ActionDescriptionComponent.ArmorPenetration]: Math.floor(
        hitOutcomeProperties.getArmorPenetration(
          user,
          actionLevel,
          this.combatAction.hitOutcomeProperties
        )
      ),
      [ActionDescriptionComponent.IsParryable]: hitOutcomeProperties.getIsParryable(
        user,
        actionLevel
      ),
      [ActionDescriptionComponent.IsBlockable]: hitOutcomeProperties.getIsBlockable(
        user,
        actionLevel
      ),
      [ActionDescriptionComponent.IsCounterable]: hitOutcomeProperties.getCanTriggerCounterattack(
        user,
        actionLevel
      ),
      [ActionDescriptionComponent.ResourceChanges]: iterateNumericEnumKeyedRecord(
        hitOutcomeProperties.resourceChangePropertiesGetters
      ).map(([resource, resourceChangePropertiesGetter]) => {
        const changeProperties = cloneDeep(
          resourceChangePropertiesGetter(
            user,
            hitOutcomeProperties,
            actionLevel,
            TARGET_DUMMY_COMBATANT.combatantProperties
          )
        );

        if (changeProperties?.baseValues) {
          changeProperties.baseValues.mult(hitOutcomeProperties.resourceChangeValuesModifier);
          changeProperties.baseValues.floor(0);
        }

        return {
          resource,
          changeProperties,
        };
      }),
      [ActionDescriptionComponent.AddsPropertiesFromHoldableSlot]:
        hitOutcomeProperties.addsPropertiesFromHoldableSlot,
      [ActionDescriptionComponent.UsableWithEquipmentTypes]:
        targetingProperties.getRequiredEquipmentTypeOptions(actionLevel),
      [ActionDescriptionComponent.AppliesConditions]: hitOutcomeProperties.getAppliedConditions(
        user,
        actionLevel
      ),
      [ActionDescriptionComponent.ClassAndLevelRequirements]:
        this.getClassAndLevelRequirements(actionLevel),
      [ActionDescriptionComponent.ByRankDescriptions]: this.getByRankDescriptions(actionLevel),
      [ActionDescriptionComponent.FlatThreatGenerated]: this.getFlatThreatGenerated(actionLevel),
    };
  }

  static getDiff<T extends Record<string, any>>(prev: T, next: T): Partial<T> {
    const diff: Partial<T> = {};

    for (const key in next) {
      if (!isEqual(prev?.[key], next[key])) {
        diff[key] = next[key];
      }
    }

    return diff;
  }
}
