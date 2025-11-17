import { plainToInstance } from "class-transformer";
import { AbilityTreeAbility, AbilityType, AbilityUtils } from "../../abilities/index.js";
import { ActionAndRank } from "../../action-user-context/action-user-targeting-properties.js";
import { COMBAT_ACTIONS } from "../../combat/combat-actions/action-implementations/index.js";
import { CombatActionComponent, CombatActionName } from "../../combat/combat-actions/index.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { iterateNumericEnumKeyedRecord, runIfInBrowser } from "../../utils/index.js";
import { CombatantTraitProperties } from "../combatant-traits/combatant-trait-properties.js";
import { CombatantTraitType } from "../combatant-traits/trait-types.js";
import { CombatantActionState } from "../owned-actions/combatant-action-state.js";
import makeAutoObservable from "mobx-store-inheritance";
import { CombatantSubsystem } from "../combatant-subsystem.js";
import { ABILITY_TREES } from "../ability-tree/set-up-ability-trees.js";
import { COMBATANT_TRAIT_DESCRIPTIONS } from "../combatant-traits/index.js";

export class CombatantAbilityProperties extends CombatantSubsystem {
  private ownedActions: Partial<Record<CombatActionName, CombatantActionState>> = {};
  private unspentAbilityPoints: number = 0;
  private traitProperties = new CombatantTraitProperties();

  constructor() {
    super();
    runIfInBrowser(() => makeAutoObservable(this));
  }

  static getDeserialized(serialized: CombatantAbilityProperties) {
    const deserialized = plainToInstance(CombatantAbilityProperties, serialized);
    return deserialized;
  }

  getUnspentPointsCount() {
    return this.unspentAbilityPoints;
  }

  changeUnspentAbilityPoints(value: number) {
    this.unspentAbilityPoints += value;
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

  // POINT ALLOCATION

  private ownedAbilityIsAtMaxAllocatableRank(ability: AbilityTreeAbility) {
    const abilityLevel = this.getAbilityRank(ability);
    const max = AbilityUtils.getAbilityMaxAllocatableRank(ability);
    if (abilityLevel >= max) return true;
    return false;
  }

  private hasPrerequisiteAbilities(ability: AbilityTreeAbility) {
    for (const prerequisite of AbilityUtils.getPrerequisites(ability)) {
      if (this.getAbilityRank(prerequisite) < 1) return false;
    }
    return true;
  }

  canAllocateAbilityPoint(ability: AbilityTreeAbility): {
    canAllocate: boolean;
    reasonCanNot?: string;
  } {
    const combatantProperties = this.getCombatantProperties();
    const { classProgressionProperties, abilityProperties } = combatantProperties;
    const mainClass = classProgressionProperties.getMainClass();
    const isMainClassAbility = AbilityUtils.abilityAppearsInTree(
      ability,
      ABILITY_TREES[mainClass.combatantClass]
    );

    const supportClassOption = classProgressionProperties.getSupportClassOption();
    const hasSupportClass = supportClassOption !== null;

    const isSupportClassAbility =
      hasSupportClass &&
      AbilityUtils.abilityAppearsInTree(ability, ABILITY_TREES[supportClassOption.combatantClass]);

    if (!isSupportClassAbility && !isMainClassAbility) {
      return {
        canAllocate: false,
        reasonCanNot: "That ability is not in any of that combatant's ability trees",
      };
    }

    if (
      ability.type === AbilityType.Trait &&
      !COMBATANT_TRAIT_DESCRIPTIONS[ability.traitType].isAllocatable
    ) {
      return {
        canAllocate: false,
        reasonCanNot: "That trait is inherent to the combatant and can not be allocated to",
      };
    }

    // has unspent points
    if (abilityProperties.getUnspentPointsCount() <= 0) {
      return { canAllocate: false, reasonCanNot: "No unspent ability points" };
    }

    // ability is max level
    if (abilityProperties.ownedAbilityIsAtMaxAllocatableRank(ability)) {
      return { canAllocate: false, reasonCanNot: "That ability is at its maximum level" };
    }

    // is required character level
    const abilityRank = abilityProperties.getAbilityRank(ability);
    const isAtRequiredCharacterLevel =
      classProgressionProperties.isRequiredClassLevelToAllocateToAbility(
        ability,
        abilityRank,
        isSupportClassAbility
      );

    if (!isAtRequiredCharacterLevel) {
      return {
        canAllocate: false,
        reasonCanNot: "That character is too low level to allocate to this ability",
      };
    }

    // has prerequisite abilities
    const hasPrerequisiteAbilities = abilityProperties.hasPrerequisiteAbilities(ability);
    if (!hasPrerequisiteAbilities) {
      return {
        canAllocate: false,
        reasonCanNot: "Requires prerequisite",
      };
    }

    return { canAllocate: true };
  }

  allocateAbilityPoint(ability: AbilityTreeAbility) {
    const { ownedActions, traitProperties } = this;
    this.changeUnspentAbilityPoints(-1);
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

  // USABILITY

  tickCooldowns() {
    for (const [actionName, actionState] of iterateNumericEnumKeyedRecord(this.ownedActions)) {
      if (actionState.wasUsedThisTurn) {
        actionState.wasUsedThisTurn = false;
      } else if (actionState.cooldown && actionState.cooldown.current) {
        actionState.cooldown.current -= 1;
      }
    }
  }

  // TRAITS

  getTraitProperties() {
    return this.traitProperties;
  }

  hasTraitType(traitType: CombatantTraitType) {
    const { traitProperties } = this;
    return (
      !!traitProperties.inherentTraitLevels[traitType] ||
      !!traitProperties.speccedTraitLevels[traitType]
    );
  }
}
