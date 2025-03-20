import { CombatActionExecutionIntent } from "../../combat/combat-actions/combat-action-execution-intent.js";
import { CombatActionName } from "../../combat/combat-actions/combat-action-names.js";
import { EntityId, MaxAndCurrent } from "../../primatives/index.js";
import { Combatant, CombatantProperties } from "../index.js";

export enum CombatantConditionName {
  Poison,
  PrimedForExplosion,
}

export const COMBATANT_CONDITION_NAME_STRINGS: Record<CombatantConditionName, string> = {
  [CombatantConditionName.Poison]: "Poison",
  [CombatantConditionName.PrimedForExplosion]: "Detonatable",
};

export const COMBATANT_CONDITION_DESCRIPTIONS: Record<CombatantConditionName, string> = {
  [CombatantConditionName.Poison]: "Periodically takes damage",
  [CombatantConditionName.PrimedForExplosion]: "Causes an explosion when hit by certain actions",
};

export abstract class CombatantCondition {
  ticks?: MaxAndCurrent;
  level: number = 0;
  constructor(
    public id: EntityId,
    public name: CombatantConditionName,
    public stacksOption: null | MaxAndCurrent
  ) {}

  abstract onTick(): void;
  // if tracking ticks, increment current
  // examples of action to take here:
  // - cause resource change
  // - removeSelf
  // - modifySelf (ex: increase debuff strength)

  abstract triggeredWhenHitBy(actionName: CombatActionName): boolean;
  // examples
  // - combatant uses ability
  // - combatant is attacked by fire
  // - "remove buff" spell is cast on combatant
  // - combatant switches equipment

  abstract triggeredWhenActionUsed(): boolean;
  //

  abstract onTriggered(combatant: Combatant): {
    removedSelf: boolean;
    triggeredActions: { user: Combatant; actionExecutionIntent: CombatActionExecutionIntent }[];
  };
  // examples:
  // - perform a composite combat action
  // - remove self - examples:
  // - ex: Poisona for a poison condition
  // - ex: Esuna for all negative conditions
  // - ex: Dispell for all positive conditions

  // getAvailableActionModifications() {
  //   // examples:
  //   // - can't cast spells
  //   // - allows attacking while dead
  //   // - restricts certain targets
  // }

  // getIntent() {
  //   // helpful (buff)
  //   // harmful (debuff)
  //   // neutral (neither)
  // }

  // attributeModifiers() {
  //   // - may be calculated to include stacks
  // }
  static removeByNameFromCombatant(
    name: CombatantConditionName,
    combatantProperties: CombatantProperties
  ) {
    combatantProperties.conditions = combatantProperties.conditions.filter((existingCondition) => {
      existingCondition.name !== name;
    });
  }

  static replaceExisting(condition: CombatantCondition, combatantProperties: CombatantProperties) {
    CombatantCondition.removeByNameFromCombatant(condition.name, combatantProperties);
    combatantProperties.conditions.push(condition);
  }
  static applyToCombatant(condition: CombatantCondition, combatantProperties: CombatantProperties) {
    let wasExisting = false;
    combatantProperties.conditions.forEach((existingCondition) => {
      if (existingCondition.name !== condition.name) return;
      wasExisting = true;
      // don't replace an existing condition of higher level
      if (existingCondition.level > condition.level) return;
      // if higher level, replace it
      if (existingCondition.level < condition.level)
        return CombatantCondition.replaceExisting(condition, combatantProperties);
      // if stackable and of same level, add to stacks
      if (existingCondition.stacksOption) return (existingCondition.stacksOption.current += 1);
      // not stackable, replace or just add it
      return CombatantCondition.replaceExisting(condition, combatantProperties);
    });

    if (!wasExisting) combatantProperties.conditions.push(condition);
  }
}
