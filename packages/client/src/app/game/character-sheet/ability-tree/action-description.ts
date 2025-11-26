import { Vector3 } from "@babylonjs/core";
import {
  AbilityTreeAbility,
  AbilityType,
  AbilityUtils,
  ActionPayableResource,
  ActionUserContext,
  AdventuringParty,
  COMBAT_ACTION_NAME_STRINGS,
  CombatActionComponent,
  CombatActionExecutionIntent,
  Combatant,
  CombatantClass,
  CombatantControlledBy,
  CombatantControllerType,
  CombatantProperties,
  CombatantSpecies,
  IActionUser,
  iterateNumericEnumKeyedRecord,
  SpeedDungeonGame,
  TargetingCalculator,
} from "@speed-dungeon/common";
import cloneDeep from "lodash.clonedeep";
import isEqual from "lodash.isequal";

export const TARGET_DUMMY_COMBATANT = Combatant.createInitialized(
  { name: "Target Dummy", id: "Target Dummy Entity Id" },
  new CombatantProperties(
    CombatantClass.Warrior,
    CombatantSpecies.Humanoid,
    null,
    new CombatantControlledBy(CombatantControllerType.Dungeon, ""),
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
  ByRankDescriptionsShort,
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
  getByRankDescriptions(user: IActionUser, party: AdventuringParty, abilityRank: number) {
    return this.combatAction.getByRankDescriptions?.(user, party)[abilityRank] || null;
  }

  getByRankShortDescriptions(user: IActionUser, party: AdventuringParty, abilityRank: number) {
    return this.combatAction.getByRankShortDescriptions?.(user, party)[abilityRank] || null;
  }

  getFlatThreatGenerated(abilityRank: number) {
    return this.combatAction.hitOutcomeProperties.flatThreatGeneratedOnHit;
  }

  getDescriptionByLevel(user: Combatant, party: AdventuringParty, actionRank: number) {
    const { combatantProperties } = user;
    const { hitOutcomeProperties, targetingProperties, costProperties } = this.combatAction;

    const resourceCosts = costProperties.getResourceCosts(user, true, actionRank);

    const critChanceOption = this.combatAction.getCritChance(user, actionRank);
    const critMultiplierOption = hitOutcomeProperties.getCritMultiplier(user, actionRank);

    // const addsPropertiesFromHoldableSlot = hitOutcomeProperties.addsPropertiesFromHoldableSlot

    return {
      [ActionDescriptionComponent.TargetingSchemes]:
        targetingProperties.getTargetingSchemes(actionRank),
      [ActionDescriptionComponent.TargetableGroups]:
        targetingProperties.getValidTargetCategories(actionRank),
      [ActionDescriptionComponent.Cooldown]: costProperties.getCooldownTurns(user, actionRank),
      [ActionDescriptionComponent.RequiresTurn]: costProperties.getEndsTurnOnUse(actionRank),
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
      [ActionDescriptionComponent.Accuracy]: this.combatAction.getAccuracy(user, actionRank),
      [ActionDescriptionComponent.CritChance]:
        critChanceOption !== null ? Math.floor(critChanceOption) : null,
      [ActionDescriptionComponent.CritMultiplier]:
        critMultiplierOption !== null ? Math.floor(critMultiplierOption * 100) : null,
      [ActionDescriptionComponent.ArmorPenetration]: Math.floor(
        hitOutcomeProperties.getArmorPenetration(
          user,
          actionRank,
          this.combatAction.hitOutcomeProperties
        )
      ),
      [ActionDescriptionComponent.IsParryable]: hitOutcomeProperties.getIsParryable(
        user,
        actionRank
      ),
      [ActionDescriptionComponent.IsBlockable]: hitOutcomeProperties.getIsBlockable(
        user,
        actionRank
      ),
      [ActionDescriptionComponent.IsCounterable]: hitOutcomeProperties.getCanTriggerCounterattack(
        user,
        actionRank
      ),
      [ActionDescriptionComponent.ResourceChanges]: iterateNumericEnumKeyedRecord(
        hitOutcomeProperties.resourceChangePropertiesGetters
      ).map(([resource, resourceChangePropertiesGetter]) => {
        const changeProperties = cloneDeep(
          resourceChangePropertiesGetter(
            user,
            hitOutcomeProperties,
            actionRank,
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
        targetingProperties.getRequiredEquipmentTypeOptions(actionRank),
      [ActionDescriptionComponent.AppliesConditions]: hitOutcomeProperties.getAppliedConditions(
        user,
        actionRank
      ),
      [ActionDescriptionComponent.ClassAndLevelRequirements]:
        this.getClassAndLevelRequirements(actionRank),
      [ActionDescriptionComponent.ByRankDescriptions]: this.getByRankDescriptions(
        user,
        party,
        actionRank
      ),
      [ActionDescriptionComponent.ByRankDescriptionsShort]: this.getByRankShortDescriptions(
        user,
        party,
        actionRank
      ),
      [ActionDescriptionComponent.FlatThreatGenerated]: this.getFlatThreatGenerated(actionRank),
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
