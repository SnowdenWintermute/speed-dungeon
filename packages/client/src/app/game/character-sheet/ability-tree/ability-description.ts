import { Vector3 } from "@babylonjs/core";
import {
  ActionPayableResource,
  COMBAT_ACTION_NAME_STRINGS,
  CombatActionComponent,
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
}

export class ActionDescription {
  constructor(private combatAction: CombatActionComponent) {}

  getName = () => COMBAT_ACTION_NAME_STRINGS[this.combatAction.name];
  getSummary = () => this.combatAction.description;
  getUsabilityContext() {
    return this.combatAction.targetingProperties.usabilityContext;
  }
  getClassAndLevelRequirements(abilityRank: number) {
    //
  }
  getCustomPropertyDescriptions(abilityRank: number) {
    // - chain lightning bounces two times
    // - applies buffs/debuffs
  }

  getDescriptionByLevel(user: CombatantProperties, actionLevel: number) {
    const { hitOutcomeProperties, targetingProperties, costProperties } = this.combatAction;

    const resourceCosts = costProperties.getResourceCosts(user, true, actionLevel);

    const critChanceOption = hitOutcomeProperties.getCritChance(user, actionLevel);
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
        return {
          resource,
          changeProperties: resourceChangePropertiesGetter(
            user,
            actionLevel,
            TARGET_DUMMY_COMBATANT
          ),
        };
      }),
      [ActionDescriptionComponent.ClassAndLevelRequirements]: "",
      [ActionDescriptionComponent.CustomPropertyDescriptions]: "",
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
