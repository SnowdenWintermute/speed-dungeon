import makeAutoObservable from "mobx-store-inheritance";
import { CombatantSubsystem } from "./combatant-subsystem.js";
import { runIfInBrowser } from "../utils/index.js";
import { CombatantCondition, CombatantConditionName } from "./combatant-conditions/index.js";
import { plainToInstance } from "class-transformer";
import { deserializeCondition } from "./combatant-conditions/deserialize-condition.js";
import { EntityId } from "../primatives/index.js";

export class CombatantConditionManager extends CombatantSubsystem {
  private conditions: CombatantCondition[] = [];

  constructor() {
    super();
    runIfInBrowser(() => makeAutoObservable(this));
  }

  static getDeserialized(plain: CombatantConditionManager) {
    const deserialized = plainToInstance(CombatantConditionManager, plain);
    deserialized.conditions = plain.conditions.map(deserializeCondition);

    return deserialized;
  }

  getConditions() {
    return this.conditions;
  }

  getConditionById(conditionId: EntityId) {
    for (const condition of this.conditions) {
      if (condition.id === conditionId) return condition;
    }
    return null;
  }

  private removeConditionByName(name: CombatantConditionName) {
    this.conditions = this.conditions.filter(
      (existingCondition) => existingCondition.name !== name
    );
  }

  private replaceExistingCondition(condition: CombatantCondition) {
    this.removeConditionByName(condition.name);
    this.conditions.push(condition);
  }

  /* returns true if condition was preexisting */
  applyCondition(condition: CombatantCondition) {
    for (const existingCondition of this.conditions) {
      if (existingCondition.name !== condition.name) {
        continue;
      }

      // don't replace an existing condition of higher level
      const existingConditionIsHigherLevel = existingCondition.level > condition.level;
      if (existingConditionIsHigherLevel) return true;

      // if higher level, replace it
      if (existingCondition.level < condition.level) {
        this.replaceExistingCondition(condition);
        return true;
      }

      // if stackable and of same level, add to stacks
      if (existingCondition.stacksOption) {
        const { stacksOption } = existingCondition;

        stacksOption.current = Math.min(
          stacksOption.current + (condition.stacksOption?.current ?? 0),
          stacksOption.max
        );

        // replacing the appliedBy helps to ensure that threat is applied correctly
        // when a replaced condition was persisted from a previous battle where it
        // was applied by a now nonexistant combatant
        existingCondition.appliedBy = condition.appliedBy;
        return true;
      }

      // not stackable, replace it
      this.replaceExistingCondition(condition);
      return true;
    }

    this.conditions.push(condition);
    return false;
  }

  removeConditionById(conditionId: EntityId): CombatantCondition | undefined {
    let removed: CombatantCondition | undefined = undefined;
    this.conditions = this.conditions.filter((condition) => {
      if (condition.id === conditionId) {
        removed = condition;
      }
      return condition.id !== conditionId;
    });

    return removed;
  }

  removeStacks(conditionId: EntityId, numberToRemove: number): CombatantCondition | undefined {
    for (const condition of this.conditions) {
      if (condition.id !== conditionId) continue;
      if (condition.stacksOption) {
        const newStacksCount = condition.stacksOption.current - numberToRemove;
        condition.stacksOption.current = Math.max(0, newStacksCount);
      }

      if (condition.stacksOption === null || condition.stacksOption.current === 0) {
        this.removeConditionById(condition.id);
        return condition;
      }
    }
    return;
  }
}
