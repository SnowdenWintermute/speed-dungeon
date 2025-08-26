import { Vector3 } from "@babylonjs/core";
import {
  AbilityTreeAbility,
  AbilityType,
  AbilityUtils,
  ActionPayableResource,
  COMBAT_ACTION_NAME_STRINGS,
  CombatActionComponent,
  Combatant,
  CombatantClass,
  CombatantProperties,
  CombatantSpecies,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import isEqual from "lodash.isequal";

export const TARGET_DUMMY_COMBATANT = new CombatantProperties(
  CombatantClass.Warrior,
  CombatantSpecies.Humanoid,
  null,
  null,
  Vector3.Zero()
);

export enum ActionDescriptionComponent {
  TargetingSchemes,
  TargetableGroups,
  Cooldown,
  RequiresTurn,
  ClassAndLevelRequirements,
  CustomPropertyDescriptions,
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
  getCustomPropertyDescriptions(abilityRank: number) {
    // - chain lightning bounces two times
    // - applies buffs/debuffs
  }

  getFlatThreatGenerated(abilityRank: number) {
    return this.combatAction.hitOutcomeProperties.flatThreatGeneratedOnHit;
  }

  getDescriptionByLevel(user: Combatant, actionLevel: number) {
    const { combatantProperties } = user;
    const { hitOutcomeProperties, targetingProperties, costProperties } = this.combatAction;

    const resourceCosts = costProperties.getResourceCosts(combatantProperties, true, actionLevel);

    const critChanceOption = hitOutcomeProperties.getCritChance(combatantProperties, actionLevel);
    const critMultiplierOption = hitOutcomeProperties.getCritMultiplier(
      combatantProperties,
      actionLevel
    );

    // const addsPropertiesFromHoldableSlot = hitOutcomeProperties.addsPropertiesFromHoldableSlot

    return {
      [ActionDescriptionComponent.TargetingSchemes]:
        targetingProperties.getTargetingSchemes(actionLevel),
      [ActionDescriptionComponent.TargetableGroups]:
        targetingProperties.getValidTargetCategories(actionLevel),
      [ActionDescriptionComponent.Cooldown]: costProperties.getCooldownTurns(
        combatantProperties,
        actionLevel
      ),
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
      [ActionDescriptionComponent.Accuracy]: this.combatAction.getAccuracy(
        combatantProperties,
        actionLevel
      ),
      [ActionDescriptionComponent.CritChance]:
        critChanceOption !== null ? Math.floor(critChanceOption) : null,
      [ActionDescriptionComponent.CritMultiplier]:
        critMultiplierOption !== null ? Math.floor(critMultiplierOption * 100) : null,
      [ActionDescriptionComponent.ArmorPenetration]: Math.floor(
        hitOutcomeProperties.getArmorPenetration(
          combatantProperties,
          actionLevel,
          this.combatAction.hitOutcomeProperties
        )
      ),
      [ActionDescriptionComponent.IsParryable]: hitOutcomeProperties.getIsParryable(
        combatantProperties,
        actionLevel
      ),
      [ActionDescriptionComponent.IsBlockable]: hitOutcomeProperties.getIsBlockable(
        combatantProperties,
        actionLevel
      ),
      [ActionDescriptionComponent.IsCounterable]: hitOutcomeProperties.getCanTriggerCounterattack(
        combatantProperties,
        actionLevel
      ),
      [ActionDescriptionComponent.ResourceChanges]: iterateNumericEnumKeyedRecord(
        hitOutcomeProperties.resourceChangePropertiesGetters
      ).map(([resource, resourceChangePropertiesGetter]) => {
        return {
          resource,
          changeProperties: resourceChangePropertiesGetter(
            combatantProperties,
            actionLevel,
            TARGET_DUMMY_COMBATANT
          ),
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
      [ActionDescriptionComponent.CustomPropertyDescriptions]: "",
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
