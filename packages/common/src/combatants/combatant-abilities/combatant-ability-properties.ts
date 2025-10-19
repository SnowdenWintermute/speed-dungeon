import { AbilityTreeAbility, AbilityType, AbilityUtils } from "../../abilities/index.js";
import { ActionAndRank } from "../../action-user-context/action-user-targeting-properties.js";
import { COMBAT_ACTIONS } from "../../combat/combat-actions/action-implementations/index.js";
import { CombatActionComponent, CombatActionName } from "../../combat/combat-actions/index.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { iterateNumericEnumKeyedRecord } from "../../utils/index.js";
import { CombatantTraitProperties } from "../combatant-traits/combatant-trait-properties.js";
import { CombatantTraitType } from "../combatant-traits/index.js";
import { CombatantActionState } from "../owned-actions/combatant-action-state.js";
import { makeAutoObservable } from "mobx";

export class CombatantAbilityProperties {
  private ownedActions: Partial<Record<CombatActionName, CombatantActionState>> = {};
  private unspentAbilityPoints: number = 0;
  private traitProperties = new CombatantTraitProperties();

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  getUnspentPointsCount() {
    return this.unspentAbilityPoints;
  }

  giveUnspentAbilityPoints(count: number) {
    this.unspentAbilityPoints += count;
  }

  getOwnedActionState(actionName: CombatActionName): Error | CombatantActionState {
    const ownedActionStateOption = this.ownedActions[actionName];
    if (ownedActionStateOption === undefined) {
      throw new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NOT_OWNED);
    }
    return ownedActionStateOption;
  }

  getCombatActionPropertiesIfOwned(actionAndRank: ActionAndRank): Error | CombatActionComponent {
    const { actionName, rank } = actionAndRank;
    const actionOption = this.ownedActions[actionName];
    if (actionOption === undefined) return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NOT_OWNED);
    if (actionOption.level < rank)
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NOT_OWNED_AT_THAT_LEVEL);
    return COMBAT_ACTIONS[actionName];
  }

  getAbilityRank(ability: AbilityTreeAbility) {
    switch (ability.type) {
      case AbilityType.Action:
        return this.ownedActions[ability.actionName]?.level || 0;
      case AbilityType.Trait:
        const { speccedTraitLevels, inherentTraitLevels } = this.traitProperties;
        return (
          (speccedTraitLevels[ability.traitType] || 0) +
          (inherentTraitLevels[ability.traitType] || 0)
        );
    }
  }

  getOwnedActions() {
    return this.ownedActions;
  }

  ownedAbilityIsAtMaxAllocatableRank(ability: AbilityTreeAbility) {
    const abilityLevel = this.getAbilityRank(ability);
    const max = AbilityUtils.getAbilityMaxAllocatableRank(ability);
    if (abilityLevel >= max) return true;
    return false;
  }

  hasPrerequisiteAbilities(ability: AbilityTreeAbility) {
    for (const prerequisite of AbilityUtils.getPrerequisites(ability)) {
      if (this.getAbilityRank(prerequisite) < 1) return false;
    }
    return true;
  }

  allocateAbilityPoint(ability: AbilityTreeAbility) {
    const { ownedActions, traitProperties } = this;
    this.unspentAbilityPoints -= 1;
    switch (ability.type) {
      case AbilityType.Action:
        const existingActionOption = ownedActions[ability.actionName];
        if (existingActionOption) existingActionOption.level += 1;
        else ownedActions[ability.actionName] = new CombatantActionState(ability.actionName);
        break;
      case AbilityType.Trait:
        const existingTraitLevel = traitProperties.speccedTraitLevels[ability.traitType];
        if (existingTraitLevel !== undefined)
          traitProperties.speccedTraitLevels[ability.traitType] = existingTraitLevel + 1;
        else traitProperties.speccedTraitLevels[ability.traitType] = 1;
    }
  }

  tickCooldowns() {
    for (const [actionName, actionState] of iterateNumericEnumKeyedRecord(this.ownedActions)) {
      if (actionState.wasUsedThisTurn) {
        actionState.wasUsedThisTurn = false;
      } else if (actionState.cooldown && actionState.cooldown.current) {
        actionState.cooldown.current -= 1;
      }
    }
  }

  hasTraitType(traitType: CombatantTraitType) {
    const { traitProperties } = this;
    return (
      !!traitProperties.inherentTraitLevels[traitType] ||
      !!traitProperties.speccedTraitLevels[traitType]
    );
  }
}
