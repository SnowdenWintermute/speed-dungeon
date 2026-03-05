import {
  ABILITIES_GRANTED_WHEN_ACTION_ALLOCATED,
  AbilityTreeAbility,
  AbilityType,
  AbilityUtils,
  ACTION_FORCED_RANKS,
} from "../../abilities/index.js";
import { ActionAndRank } from "../../action-user-context/action-user-targeting-properties.js";
import { COMBAT_ACTIONS } from "../../combat/combat-actions/action-implementations/index.js";
import { CombatActionComponent } from "../../combat/combat-actions/index.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { CombatantTraitProperties } from "../combatant-traits/combatant-trait-properties.js";
import { CombatantTraitType } from "../combatant-traits/trait-types.js";
import { CombatantActionState } from "../owned-actions/combatant-action-state.js";
import makeAutoObservable from "mobx-store-inheritance";
import { CombatantSubsystem } from "../combatant-subsystem.js";
import { ABILITY_TREES } from "../ability-tree/set-up-ability-trees.js";
import { COMBATANT_TRAIT_DESCRIPTIONS } from "../combatant-traits/index.js";
import { getTamePetMaxPetLevel } from "../../combat/combat-actions/action-implementations/summon-pet/tame-pet.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { Combatant } from "../index.js";
import cloneDeep from "lodash.clonedeep";
import { CombatantConditionName } from "../../conditions/condition-names.js";
import { CombatantConditionFactory } from "../../conditions/condition-factory.js";
import { CombatActionName } from "../../combat/combat-actions/combat-action-names.js";
import { FriendOrFoe } from "../../combat/combat-actions/targeting-schemes-and-categories.js";
import { DungeonRoomType } from "../../adventuring-party/dungeon-room.js";
import { ReactiveNode, Serializable, SerializedOf } from "../../serialization/index.js";
import { MapUtils } from "../../utils/map-utils.js";

export class CombatantAbilityProperties
  extends CombatantSubsystem
  implements Serializable, ReactiveNode
{
  private ownedActions = new Map<CombatActionName, CombatantActionState>();
  private unspentAbilityPoints: number = 0;
  private traitProperties = new CombatantTraitProperties();

  makeObservable() {
    makeAutoObservable(this);
    for (const [_, action] of this.ownedActions) {
      action.makeObservable();
    }
    this.traitProperties.makeObservable();
  }

  toSerialized() {
    return {
      ownedActions: MapUtils.serialize(this.ownedActions, (v) => v.toSerialized()),
      unspentAbilityPoints: this.unspentAbilityPoints,
      traitProperties: this.traitProperties.toSerialized(),
    };
  }

  static fromSerialized(serialized: SerializedOf<CombatantAbilityProperties>) {
    const result = new CombatantAbilityProperties();
    result.ownedActions = MapUtils.deserialize(
      serialized.ownedActions,
      CombatantActionState.fromSerialized
    );
    result.unspentAbilityPoints = serialized.unspentAbilityPoints;
    result.traitProperties = CombatantTraitProperties.fromSerialized(serialized.traitProperties);
    return result;
  }

  getUnspentPointsCount() {
    return this.unspentAbilityPoints;
  }

  changeUnspentAbilityPoints(value: number) {
    this.unspentAbilityPoints += value;
  }

  setUnspentAbilityPoints(value: number) {
    this.unspentAbilityPoints = value;
  }

  getOwnedActionState(actionName: CombatActionName): Error | CombatantActionState {
    const ownedActionStateOption = this.ownedActions.get(actionName);
    if (ownedActionStateOption === undefined) {
      throw new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NOT_OWNED);
    }
    return ownedActionStateOption;
  }

  getCombatActionPropertiesIfOwned(actionAndRank: ActionAndRank): Error | CombatActionComponent {
    const { actionName, rank } = actionAndRank;
    const actionOption = this.ownedActions.get(actionName);
    if (actionOption === undefined) return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NOT_OWNED);
    if (actionOption.level < rank)
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NOT_OWNED_AT_THAT_LEVEL);
    return COMBAT_ACTIONS[actionName];
  }

  getAbilityRank(ability: AbilityTreeAbility) {
    switch (ability.type) {
      case AbilityType.Action:
        return this.ownedActions.get(ability.actionName)?.level || 0;
      case AbilityType.Trait: {
        const { speccedTraitLevels, inherentTraitLevels } = this.traitProperties;
        return (
          (speccedTraitLevels[ability.traitType] || 0) +
          (inherentTraitLevels[ability.traitType] || 0)
        );
      }
    }
  }

  getOwnedActions() {
    return this.ownedActions;
  }

  setOwnedAction(actionState: CombatantActionState) {
    this.ownedActions.set(actionState.actionName, actionState);
  }

  getOwnedActionOption(actionName: CombatActionName) {
    return this.ownedActions.get(actionName);
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

  private changeAbilityRank(ability: AbilityTreeAbility, changeBy: number) {
    const { ownedActions, traitProperties } = this;
    switch (ability.type) {
      case AbilityType.Action: {
        const existingActionOption = ownedActions.get(ability.actionName);
        const actionComesWith = ABILITIES_GRANTED_WHEN_ACTION_ALLOCATED[ability.actionName];

        const forcedRankOption = ACTION_FORCED_RANKS[ability.actionName];

        // some abilities grant "sub abilities" such as Tame Pet which comes with all associated
        // pet abilities
        if (actionComesWith) {
          for (const extraAbility of actionComesWith) {
            this.changeAbilityRank(extraAbility, changeBy);
          }
        }

        if (existingActionOption) {
          existingActionOption.level += changeBy;
          if (forcedRankOption !== undefined) {
            existingActionOption.level = forcedRankOption;
          }
        } else {
          ownedActions.set(
            ability.actionName,
            new CombatantActionState(ability.actionName, forcedRankOption || 1)
          );
        }
        break;
      }
      case AbilityType.Trait: {
        const existingTraitLevel = traitProperties.speccedTraitLevels[ability.traitType];
        if (existingTraitLevel !== undefined)
          traitProperties.speccedTraitLevels[ability.traitType] = existingTraitLevel + changeBy;
        else traitProperties.speccedTraitLevels[ability.traitType] = changeBy;
      }
    }
  }

  allocateAbilityPoint(ability: AbilityTreeAbility) {
    this.changeUnspentAbilityPoints(-1);
    this.changeAbilityRank(ability, 1);
  }

  // USABILITY

  tickCooldowns() {
    for (const [actionName, actionState] of this.ownedActions) {
      if (actionState.wasUsedThisTurn) {
        actionState.wasUsedThisTurn = false;
      } else if (actionState.cooldown && actionState.cooldown.current) {
        actionState.cooldown.current -= 1;
      }
    }
  }

  getMaxPetLevel() {
    const summonPetRank = this.getAbilityRank({
      type: AbilityType.Action,
      actionName: CombatActionName.SummonPetParent,
    });
    if (summonPetRank === 0) {
      return 1;
    }
    const max = getTamePetMaxPetLevel(summonPetRank);
    return max;
  }

  // TRAITS

  getTraitProperties() {
    return this.traitProperties;
  }

  applyConditionsFromTraits(self: Combatant, idGenerator: IdGenerator) {
    for (const [traitType, rank] of this.traitProperties.iterateAllTraits()) {
      if (traitType === CombatantTraitType.Flyer) {
        const flyingCondition = CombatantConditionFactory.create({
          name: CombatantConditionName.Flying,
          rank: 1,
          stacks: null,
          id: idGenerator.generate(),
          appliedBy: {
            friendOrFoe: FriendOrFoe.Friendly,
            entityProperties: cloneDeep(self.entityProperties),
          },
          appliedTo: self.getEntityId(),
        });
        this.getCombatantProperties().conditionManager.applyCondition(flyingCondition);
      }
    }
  }

  canGainFlying() {
    const isEnsnared = this.getCombatantProperties().conditionManager.hasConditionName(
      CombatantConditionName.Ensnared
    );
    return !isEnsnared;
  }

  shardConversionPermitted(currentRoomType: DungeonRoomType) {
    return (
      currentRoomType === DungeonRoomType.VendingMachine ||
      this.getTraitProperties().hasTraitType(CombatantTraitType.CanConvertToShardsManually)
    );
  }

  requireShardConversionPermitted(currentRoomType: DungeonRoomType) {
    if (!this.shardConversionPermitted(currentRoomType)) {
      throw new Error(ERROR_MESSAGES.NOT_PERMITTED);
    }
  }
}
