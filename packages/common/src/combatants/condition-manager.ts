import makeAutoObservable from "mobx-store-inheritance";
import { CombatantSubsystem } from "./combatant-subsystem.js";
import { CombatantCondition } from "../conditions/index.js";
import { EntityId } from "../aliases.js";
import { CombatantConditionName } from "../conditions/condition-names.js";
import { ReactiveNode, Serializable, SerializedOf } from "../serialization/index.js";
import { deserializeCondition } from "../conditions/deserialize-condition.js";

export class CombatantConditionManager
  extends CombatantSubsystem
  implements ReactiveNode, Serializable
{
  private conditions: CombatantCondition[] = [];

  makeObservable() {
    makeAutoObservable(this);
    this.conditions.forEach((condition) => condition.makeObservable());
  }

  toSerialized() {
    return { conditions: this.conditions.map((condition) => condition.toSerialized()) };
  }

  static fromSerialized(serialized: SerializedOf<CombatantConditionManager>) {
    /** Conditions deserialize to an init object and reconstruct using their
     * specific constructors via that object. plainToInstance does not work with
     * the current implementation of conditions for reasons beyond my understanding, but
     * allegedly because the getTickProperties() declaration takes in functions as arguments
     * and makes them "own properties" of the class instance, which when plainToInstance tries to traverse
     * and execute it can't */
    const result = new CombatantConditionManager();
    result.conditions = serialized.conditions.map((conditionInit) =>
      deserializeCondition(conditionInit)
    );

    return result;
  }

  getConditions() {
    return this.conditions;
  }

  getConditionByName(name: CombatantConditionName) {
    return this.conditions.find((item) => item.name === name);
  }

  getConditionById(conditionId: EntityId) {
    for (const condition of this.conditions) {
      if (condition.id === conditionId) return condition;
    }
    return null;
  }

  removeConditionByName(name: CombatantConditionName) {
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
    if (condition.multiplesAllowed) {
      this.conditions.push(condition);
      return false;
    }

    for (const existingCondition of this.conditions) {
      if (existingCondition.name !== condition.name) {
        continue;
      }

      // don't replace an existing condition of higher level
      const existingConditionIsHigherLevel = existingCondition.rank > condition.rank;
      if (existingConditionIsHigherLevel) return true;

      // if higher level, replace it
      if (existingCondition.rank < condition.rank) {
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

      if (condition.stacksOption === undefined || condition.stacksOption.current === 0) {
        this.removeConditionById(condition.id);
        return condition;
      }
    }
    return;
  }

  hasConditionName(conditionName: CombatantConditionName) {
    return this.getConditions()
      .map((condition) => condition.name)
      .includes(conditionName);
  }
}
