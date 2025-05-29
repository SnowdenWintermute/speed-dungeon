import { CombatActionExecutionIntent } from "../../combat/combat-actions/combat-action-execution-intent.js";
import { CombatActionName } from "../../combat/combat-actions/combat-action-names.js";
import { CosmeticEffectOnTargetTransformNode } from "../../combat/combat-actions/combat-action-steps-config.js";
import { EntityId, MaxAndCurrent } from "../../primatives/index.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { removeFromArray } from "../../utils/index.js";
import { Combatant, CombatantProperties } from "../index.js";
import { PrimedForExplosionCombatantCondition } from "./primed-for-explosion.js";
import { PrimedForIceBurstCombatantCondition } from "./primed-for-ice-burst.js";

export enum CombatantConditionName {
  // Poison,
  PrimedForExplosion,
  PrimedForIceBurst,
}

export const COMBATANT_CONDITION_NAME_STRINGS: Record<CombatantConditionName, string> = {
  // [CombatantConditionName.Poison]: "Poison",
  [CombatantConditionName.PrimedForExplosion]: "Detonatable",
  [CombatantConditionName.PrimedForIceBurst]: "Shatterable",
};

export const COMBATANT_CONDITION_DESCRIPTIONS: Record<CombatantConditionName, string> = {
  // [CombatantConditionName.Poison]: "Periodically takes damage",
  [CombatantConditionName.PrimedForExplosion]: "Causes an explosion when hit by certain actions",
  [CombatantConditionName.PrimedForIceBurst]: "Causes an ice burst when hit by certain actions",
};

type CombatantConditionConstructor = new (
  id: EntityId,
  appliedBy: EntityId,
  name: CombatantConditionName,
  stacksOption: null | MaxAndCurrent
) => CombatantCondition;

export const COMBATANT_CONDITION_CONSTRUCTORS: Record<
  CombatantConditionName,
  CombatantConditionConstructor
> = {
  [CombatantConditionName.PrimedForExplosion]: PrimedForExplosionCombatantCondition,
  [CombatantConditionName.PrimedForIceBurst]: PrimedForIceBurstCombatantCondition,
};

export abstract class CombatantCondition {
  ticks?: MaxAndCurrent;
  level: number = 0;
  constructor(
    public id: EntityId,
    public appliedBy: EntityId,
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

  abstract onTriggered(
    combatant: Combatant,
    idGenerator: IdGenerator
  ): {
    numStacksRemoved: number;
    triggeredActions: { user: Combatant; actionExecutionIntent: CombatActionExecutionIntent }[];
  };

  abstract getCosmeticEffectWhileActive: (
    combatantId: EntityId
  ) => CosmeticEffectOnTargetTransformNode[];
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
      if (existingCondition.stacksOption) {
        if (existingCondition.stacksOption.max > existingCondition.stacksOption.current)
          existingCondition.stacksOption.current += 1;
        return;
      }
      // not stackable, replace or just add it
      return CombatantCondition.replaceExisting(condition, combatantProperties);
    });

    if (!wasExisting) combatantProperties.conditions.push(condition);
  }

  static removeById(
    conditionId: EntityId,
    combatantProperties: CombatantProperties
  ): CombatantCondition | undefined {
    let removed: CombatantCondition | undefined = undefined;
    combatantProperties.conditions = combatantProperties.conditions.filter((condition) => {
      if (condition.id === conditionId) removed = condition;
      return condition.id !== conditionId;
    });

    return removed;
  }

  static removeStacks(
    conditionId: EntityId,
    combatantProperties: CombatantProperties,
    numberToRemove: number
  ): CombatantCondition | undefined {
    for (const condition of Object.values(combatantProperties.conditions)) {
      if (condition.id !== conditionId) continue;
      if (condition.stacksOption)
        condition.stacksOption.current = Math.max(
          0,
          condition.stacksOption.current - numberToRemove
        );

      if (condition.stacksOption === null || condition.stacksOption.current === 0) {
        removeFromArray(combatantProperties.conditions, condition);
        return condition;
      }
    }
    return;
  }
}
