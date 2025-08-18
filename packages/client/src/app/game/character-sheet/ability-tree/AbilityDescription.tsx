import { Vector3 } from "@babylonjs/core";
import {
  COMBAT_ACTION_NAME_STRINGS,
  CombatActionComponent,
  CombatActionResource,
  CombatantClass,
  CombatantProperties,
  CombatantSpecies,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { CombatActionResourceChangeProperties } from "@speed-dungeon/common/src/combat/combat-actions/combat-action-resource-change-properties";
import React from "react";

export const TARGET_DUMMY_COMBATANT = new CombatantProperties(
  CombatantClass.Warrior,
  CombatantSpecies.Humanoid,
  null,
  null,
  Vector3.Zero()
);

export default function AbilityDescription() {
  return <div>AbilityDescription</div>;
}

export class ActionDescription {
  constructor(private combatAction: CombatActionComponent) {}

  getName = () => COMBAT_ACTION_NAME_STRINGS[this.combatAction.name];
  getDescription = () => this.combatAction.description;
  getUsabilityContext() {
    return this.combatAction.targetingProperties.usabilityContext;
  }
  getTargetingSchemes(actionLevel: number) {
    return this.combatAction.targetingProperties.getTargetingSchemes(actionLevel);
  }
  getTargetableGroups(actionLevel: number) {
    return this.combatAction.targetingProperties.getValidTargetCategories(actionLevel);
  }
  getResourceCosts(user: CombatantProperties, inCombat: boolean, actionLevel: number) {
    return this.combatAction.costProperties.getResourceCosts(user, inCombat, actionLevel);
  }
  getCooldown(user: CombatantProperties, actionLevel: number) {
    return this.combatAction.costProperties.getCooldownTurns(user, actionLevel);
  }
  endsTurnOnUse() {
    // @TODO - add cost property "always ends turn on use" because .requiresCombatTurn is used for contextual calculation
    // such as when attack main hand needs to see if it should end turn
  }
  getHpChangeProperties(
    user: CombatantProperties,
    actionLevel: number,
    primaryTarget: CombatantProperties
  ) {
    // @TODO - figure out how to display the various hit outcome properties and which ones should not
    // be displayed if they are just defaults
    const accuracy = this.combatAction.getAccuracy(user, actionLevel);
    const { hitOutcomeProperties } = this.combatAction;
    const critChance = hitOutcomeProperties.getCritChance(user, actionLevel);
    const critMultiplier = hitOutcomeProperties.getCritMultiplier(user, actionLevel);
    const armorPenetration = hitOutcomeProperties.getArmorPenetration(
      user,
      actionLevel,
      this.combatAction.hitOutcomeProperties
    );
    const isParryable = hitOutcomeProperties.getIsParryable(user, actionLevel);
    const isBlockable = hitOutcomeProperties.getIsBlockable(user, actionLevel);
    const isCounterable = hitOutcomeProperties.getCanTriggerCounterattack(user, actionLevel);

    const resourceChanges: Partial<
      Record<CombatActionResource, CombatActionResourceChangeProperties>
    > = {};

    for (const [resource, resourceChangeGetter] of iterateNumericEnumKeyedRecord(
      hitOutcomeProperties.resourceChangePropertiesGetters
    )) {
      const resourceChangeProperties = resourceChangeGetter(user, actionLevel, primaryTarget);
      if (resourceChangeProperties !== null) resourceChanges[resource] = resourceChangeProperties;
    }
  }
  getClassAndLevelRequirements(abilityRank: number) {
    //
  }
  getCustomPropertyDescriptions(abilityRank: number) {
    // - chain lightning bounces two times
    // - applies buffs/debuffs
  }
}

// name
// brief description
// usability context
// targeting scheme
// targetable groups
// ap cost
// ends turn on use
// cooldown
// mana cost
// hp change range / types
// class / level requirement
