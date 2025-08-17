import {
  COMBAT_ACTION_NAME_STRINGS,
  CombatActionComponent,
  CombatantProperties,
} from "@speed-dungeon/common";
import React from "react";

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
  getHpChangeProperties() {
    // @TODO - figure out how to display the various hit outcome properties and which ones should not
    // be displayed if they are just defaults
  }
  getClassAndLevelRequirements(abilityRank: number) {
    //
  }
  getCustomPropertyDescriptions(abilityRank: number) {
    //
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
//
// custom information
// - chain lightning bounces two times
// - applies buffs/debuffs
