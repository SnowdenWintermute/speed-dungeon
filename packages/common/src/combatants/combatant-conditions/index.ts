import { immerable } from "immer";
import { Option } from "../../primatives/index.js";
import { Battle } from "../../battle/index.js";
import { CombatActionExecutionIntent } from "../../combat/combat-actions/combat-action-execution-intent.js";
import { CombatActionIntent } from "../../combat/combat-actions/combat-action-intent.js";
import { CombatActionName } from "../../combat/combat-actions/combat-action-names.js";
import { CosmeticEffectOnTargetTransformNode } from "../../combat/combat-actions/combat-action-steps-config.js";
import { FriendOrFoe } from "../../combat/combat-actions/targeting-schemes-and-categories.js";
import { CombatantContext } from "../../combatant-context/index.js";
import { EntityId, EntityProperties, MaxAndCurrent } from "../../primatives/index.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { Combatant, CombatantAttributeRecord, CombatantProperties } from "../index.js";
import { BurningCombatantCondition } from "./burning.js";
import { PrimedForExplosionCombatantCondition } from "./primed-for-explosion.js";
import { PrimedForIceBurstCombatantCondition } from "./primed-for-ice-burst.js";
import { AdventuringParty } from "../../adventuring-party/index.js";
import { TurnOrderManager, TurnTrackerEntityType } from "../../combat/index.js";
import { BASE_ACTION_DELAY_MULTIPLIER } from "../../combat/turn-order/consts.js";
import { BlindedCombatantCondition } from "./blinded.js";
import { ActionUserContext, IActionUser } from "../../combatant-context/action-user.js";
import { ActionIntentAndUser } from "../../action-processing/index.js";
import { ActionUserTargetingProperties } from "../../combatant-context/action-user-targeting-properties.js";

export enum CombatantConditionName {
  // Poison,
  PrimedForExplosion,
  PrimedForIceBurst,
  Burning,
  Blinded,
}

export const COMBATANT_CONDITION_NAME_STRINGS: Record<CombatantConditionName, string> = {
  // [CombatantConditionName.Poison]: "Poison",
  [CombatantConditionName.PrimedForExplosion]: "Detonatable",
  [CombatantConditionName.PrimedForIceBurst]: "Shatterable",
  [CombatantConditionName.Burning]: "Burning",
  [CombatantConditionName.Blinded]: "Blinded",
};

export const COMBATANT_CONDITION_DESCRIPTIONS: Record<CombatantConditionName, string> = {
  // [CombatantConditionName.Poison]: "Periodically takes damage",
  [CombatantConditionName.PrimedForExplosion]: "Causes an explosion when hit by certain actions",
  [CombatantConditionName.PrimedForIceBurst]: "Causes an ice burst when hit by certain actions",
  [CombatantConditionName.Burning]: "Periodically takes non-magical fire damage",
  [CombatantConditionName.Blinded]: "Accuracy is reduced",
};

export const MAX_CONDITION_STACKS = 99;

type CombatantConditionConstructor = new (
  id: EntityId,
  appliedBy: ConditionAppliedBy,
  level: number,
  stacksOption: null | MaxAndCurrent
) => CombatantCondition;

export const COMBATANT_CONDITION_CONSTRUCTORS: Record<
  CombatantConditionName,
  CombatantConditionConstructor
> = {
  [CombatantConditionName.PrimedForExplosion]: PrimedForExplosionCombatantCondition,
  [CombatantConditionName.PrimedForIceBurst]: PrimedForIceBurstCombatantCondition,
  [CombatantConditionName.Burning]: BurningCombatantCondition,
  [CombatantConditionName.Blinded]: BlindedCombatantCondition,
};

export interface ConditionAppliedBy {
  entityProperties: EntityProperties;
  // we store this because at the time a condition is triggered,
  // the entity which originally applied the condition may no longer exist
  // yet we still must figure out the target ids of the condition's triggered
  // action based on its intent and friend or foe status of targets
  // where normally we would just calculate that based off a condition user's
  // presence in a certain battle group relative to the target's battle group
  friendOrFoe: FriendOrFoe;
}

export interface ConditionTickProperties {
  getTickSpeed(condition: CombatantCondition): number;
  onTick(context: ActionUserContext): {
    numStacksRemoved: number;
    triggeredAction: {
      actionIntentAndUser: ActionIntentAndUser;
      getConsumableType?: () => null;
    };
  };
}

export interface ConditionWithCombatantIdAppliedTo {
  condition: CombatantCondition;
  appliedTo: EntityId;
}

export abstract class CombatantCondition implements IActionUser {
  [immerable] = true;
  ticks?: MaxAndCurrent;
  level: number = 0;
  intent: CombatActionIntent = CombatActionIntent.Malicious;
  removedOnDeath: boolean = true;
  combatAttributes?: CombatantAttributeRecord = {};
  targetingProperties?: ActionUserTargetingProperties;
  constructor(
    public id: EntityId,
    public appliedBy: ConditionAppliedBy,
    public name: CombatantConditionName,
    public stacksOption: null | MaxAndCurrent
  ) {}
  getAllyAndOpponentIds(): Record<FriendOrFoe, EntityId[]> {
    throw new Error("Method not implemented.");
  }
  getTargetingProperties(): ActionUserTargetingProperties {
    if (this.targetingProperties) return this.targetingProperties;
    throw new Error("Condition was not configured with targetingProperties");
  }
  payResourceCosts = () => {};
  handleTurnEnded = () => {};
  getEntityId = () => this.id;
  getLevel = () => this.level;
  getTotalAttributes = () => this.combatAttributes || {};
  getOwnedAbilities() {
    return {};
  }
  getEquipmentOption = () => null;
  getInventoryOption = () => null;
  getIdOfEntityToCreditWithThreat = () => this.appliedBy.entityProperties.id;

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
    actionUserContext: ActionUserContext,
    targetCombatant: Combatant,
    idGenerator: IdGenerator
  ): {
    numStacksRemoved: number;
    triggeredActions: ActionIntentAndUser[];
  };

  abstract getCosmeticEffectWhileActive: (
    combatantId: EntityId
  ) => CosmeticEffectOnTargetTransformNode[];

  abstract tickPropertiesOption: Option<ConditionTickProperties>;

  abstract getAttributeModifiers?(
    condition: CombatantCondition,
    appliedTo: CombatantProperties
  ): CombatantAttributeRecord;

  static getTickProperties(condition: CombatantCondition) {
    return condition.tickPropertiesOption;
  }

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

  /* returns true if condition was preexisting */
  static applyToCombatant(
    condition: CombatantCondition,
    combatant: Combatant,
    battleOption: null | Battle,
    party: AdventuringParty
  ) {
    let wasExisting = false;
    const { combatantProperties } = combatant;
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
          existingCondition.stacksOption.current += condition.stacksOption?.current ?? 0;
        // replacing the appliedBy helps to ensure that threat is applied correctly
        // when a replaced condition was persisted from a previous battle where it
        // was applied by a now nonexistant combatant
        existingCondition.appliedBy = condition.appliedBy;
        return;
      }
      // not stackable, replace or just add it
      return CombatantCondition.replaceExisting(condition, combatantProperties);
    });

    if (wasExisting) return true;
    combatantProperties.conditions.push(condition);

    const tickPropertiesOption = CombatantCondition.getTickProperties(condition);

    if (!tickPropertiesOption || !battleOption) return;

    // add one actions worth + 1 delay or else when we get to the endTurnAndEvaluateInputLock step
    // when we search for the fastest scheduler tracker it will find this
    // condition's tracker instead of the combatant, since we are adding the scheduler now
    // and the combatant who's action applied this condition won't update their scheduler
    // until a later step
    const appliedByScheduler =
      battleOption.turnOrderManager.turnSchedulerManager.getSchedulerByCombatantId(
        condition.appliedBy.entityProperties.id
      );

    // once we start getting action delay costs that are different per each action
    // we'll have to calculate this based on the current action
    const appliedByPredictedAdditionalDelay = TurnOrderManager.getActionDelayCost(
      appliedByScheduler.getSpeed(party),
      BASE_ACTION_DELAY_MULTIPLIER
    );

    const combatantApplyingAccumulatedDelay = appliedByScheduler.accumulatedDelay;

    battleOption.turnOrderManager.turnSchedulerManager.addNewScheduler(
      {
        type: TurnTrackerEntityType.Condition,
        combatantId: combatant.entityProperties.id,
        conditionId: condition.id,
      },
      combatantApplyingAccumulatedDelay + appliedByPredictedAdditionalDelay + 1
    );
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

    // @PERF - remove the associated turn scheduler
    // from the battle

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
        CombatantCondition.removeById(condition.id, combatantProperties);
        return condition;
      }
    }
    return;
  }
}
