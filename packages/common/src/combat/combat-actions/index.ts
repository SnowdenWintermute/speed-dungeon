export * from "./combat-action-hit-outcome-properties.js";
export * from "./combat-action-names.js";
export * from "./targeting-schemes-and-categories.js";
export * from "./combat-action-usable-cotexts.js";
export * from "./action-calculation-utils/action-costs.js";
export * from "./combat-action-execution-intent.js";
export * from "./combat-action-animations.js";
export * from "./combat-action-intent.js";
export * from "./combat-action-steps-config.js";
import {
  Combatant,
  CombatantProperties,
  getCombatActionPropertiesIfOwned,
} from "../../combatants/index.js";
import { CombatActionUsabilityContext } from "./combat-action-usable-cotexts.js";
import { CombatActionName } from "./combat-action-names.js";
import { Battle } from "../../battle/index.js";
import { ActionAccuracyType } from "./combat-action-accuracy.js";
import { CombatActionRequiredRange } from "./combat-action-range.js";
import { CombatantContext } from "../../combatant-context/index.js";
import { ActionResolutionStepContext, ActionTracker } from "../../action-processing/index.js";
import { CombatActionExecutionIntent } from "./combat-action-execution-intent.js";
import { SpawnableEntity } from "../../spawnables/index.js";
import {
  CombatActionTargetingProperties,
  CombatActionTargetingPropertiesConfig,
} from "./combat-action-targeting-properties.js";
import { CombatActionHitOutcomeProperties } from "./combat-action-hit-outcome-properties.js";
import {
  CombatActionCostProperties,
  CombatActionCostPropertiesConfig,
} from "./combat-action-cost-properties.js";
import { ActionResolutionStepsConfig } from "./combat-action-steps-config.js";
import { CombatActionTarget } from "../targeting/combat-action-targets.js";
import { ERROR_MESSAGES } from "../../errors/index.js";

export enum CombatActionOrigin {
  SpellCast,
  TriggeredCondition,
  Medication,
  Attack,
}

export interface ActionUseMessageData {
  nameOfActionUser?: string;
  nameOfTarget?: string;
  actionLevel?: number;
}

export interface CombatActionComponentConfig {
  description: string;
  /** Used by the combat log to determine how to format messages */
  origin: CombatActionOrigin;

  targetingProperties: CombatActionTargetingPropertiesConfig;
  hitOutcomeProperties: CombatActionHitOutcomeProperties;
  costProperties: CombatActionCostPropertiesConfig;
  stepsConfig: ActionResolutionStepsConfig;

  shouldExecute: (
    combatantContext: CombatantContext,
    previousTrackerOption: undefined | ActionTracker,
    self: CombatActionComponent
  ) => boolean;

  getOnUseMessage: null | ((messageData: ActionUseMessageData) => string);
  getOnUseMessageDataOverride?: (context: ActionResolutionStepContext) => ActionUseMessageData;

  getRequiredRange: (
    user: CombatantProperties,
    self: CombatActionComponent
  ) => CombatActionRequiredRange;

  getSpawnableEntity?: (context: ActionResolutionStepContext) => SpawnableEntity;

  // ACTION HEIRARCHY PROPERTIES
  getChildren: (context: ActionResolutionStepContext) => CombatActionComponent[];
  getConcurrentSubActions?: (context: ActionResolutionStepContext) => CombatActionExecutionIntent[];
  getParent: () => CombatActionComponent | null;
}

export abstract class CombatActionComponent {
  public readonly description: string;
  public readonly origin: CombatActionOrigin;
  public readonly targetingProperties: CombatActionTargetingProperties;
  public readonly hitOutcomeProperties: CombatActionHitOutcomeProperties;
  public readonly costProperties: CombatActionCostProperties;
  public readonly stepsConfig: ActionResolutionStepsConfig;
  protected children?: CombatActionComponent[];

  isUsableInGivenContext(context: CombatActionUsabilityContext) {
    switch (context) {
      case CombatActionUsabilityContext.All:
        return true;
      case CombatActionUsabilityContext.InCombat:
        return (
          this.targetingProperties.usabilityContext !== CombatActionUsabilityContext.OutOfCombat
        );
      case CombatActionUsabilityContext.OutOfCombat:
        return this.targetingProperties.usabilityContext !== CombatActionUsabilityContext.InCombat;
    }
  }

  isUsableInThisContext: (battleOption: Battle | null) => boolean = (
    battleOption: Battle | null
  ) => {
    const context = battleOption
      ? CombatActionUsabilityContext.InCombat
      : CombatActionUsabilityContext.OutOfCombat;
    return this.isUsableInGivenContext(context);
  };

  shouldExecute: (
    combatantContext: CombatantContext,
    previousTrackerOption: undefined | ActionTracker
  ) => boolean;
  getOnUseMessage: null | ((messageData: ActionUseMessageData) => string);
  getRequiredRange: (user: CombatantProperties) => CombatActionRequiredRange;
  getSpawnableEntity?: (context: ActionResolutionStepContext) => SpawnableEntity;

  // if we take in the combatant we can determine the children based on their equipped weapons (melee attack mh, melee attack oh etc)
  // spell levels (level 1 chain lightning only gets 1 ChainLightningArc child) or other status
  // (energetic swings could do multiple attacks based on user's current percent of max hp)
  // could also create random children such as a chaining random elemental damage
  getChildren: (context: ActionResolutionStepContext) => CombatActionComponent[];
  getConcurrentSubActions: (context: ActionResolutionStepContext) => CombatActionExecutionIntent[] =
    () => [];
  getParent: () => CombatActionComponent | null;
  addChild: (childAction: CombatActionComponent) => Error | void = () =>
    new Error("Can't add a child to this component");

  constructor(
    public name: CombatActionName,
    config: CombatActionComponentConfig
  ) {
    this.description = config.description;
    this.origin = config.origin;
    this.targetingProperties = {
      ...config.targetingProperties,
      getAutoTarget: (combatantContext, trackerOption) =>
        config.targetingProperties.getAutoTarget(combatantContext, trackerOption, this),
    };
    this.hitOutcomeProperties = config.hitOutcomeProperties;
    this.costProperties = {
      ...config.costProperties,
      getResourceCosts: (user: CombatantProperties, inCombat: boolean, actionLevel: number) =>
        config.costProperties.getResourceCosts(user, inCombat, actionLevel, this),
    };

    this.shouldExecute = (combatantContext, previousTrackerOption) =>
      config.shouldExecute(combatantContext, previousTrackerOption, this);
    this.getOnUseMessage = config.getOnUseMessage;
    if (config.getOnUseMessageDataOverride)
      this.getOnUseMessageData = config.getOnUseMessageDataOverride;
    this.getRequiredRange = (user) => config.getRequiredRange(user, this);
    this.getSpawnableEntity = config.getSpawnableEntity;
    this.stepsConfig = config.stepsConfig;

    this.getChildren = config.getChildren;
    if (config.getConcurrentSubActions)
      this.getConcurrentSubActions = config.getConcurrentSubActions;
    this.getParent = config.getParent;
  }

  getOnUseMessageData(context: ActionResolutionStepContext): ActionUseMessageData {
    const { combatantContext } = context;
    const { combatant } = combatantContext;
    const { selectedActionLevel } = combatant.combatantProperties;
    return {
      nameOfActionUser: combatant.entityProperties.name,
      actionLevel: selectedActionLevel ?? 0,
    };
  }

  combatantIsValidTarget(
    user: Combatant, // to check who their allies are
    combatant: Combatant, // to check their conditions, traits and other state like current hp
    battleOption: null | Battle // finding out allies/enemies
  ): boolean {
    // for AI behavior
    // - check targetable groups (friend or foe)
    // - check prohibited combatant state
    // - check traits and conditions
    return true;
  }
  getAccuracy(user: CombatantProperties, actionLevel: number) {
    const baseAccuracy = this.hitOutcomeProperties.getUnmodifiedAccuracy(user, actionLevel);
    if (baseAccuracy.type === ActionAccuracyType.Percentage)
      baseAccuracy.value *= this.hitOutcomeProperties.accuracyModifier;
    return baseAccuracy;
  }

  useIsValid(
    targets: CombatActionTarget,
    level: number,
    combatantContext: CombatantContext
  ): Error | void {
    const { game, party, combatant } = combatantContext;
    const { combatantProperties } = combatant;

    const combatActionPropertiesResult = getCombatActionPropertiesIfOwned(
      combatant.combatantProperties,
      this.name,
      level
    );
    if (combatActionPropertiesResult instanceof Error) return combatActionPropertiesResult;

    const actionStateOption = combatantProperties.ownedActions[this.name];
    if (actionStateOption && actionStateOption.cooldown && actionStateOption.cooldown.current)
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.IS_ON_COOLDOWN);

    const hasRequiredConsumables = CombatantProperties.hasRequiredConsumablesToUseAction(
      combatantProperties,
      this.name
    );
    if (!hasRequiredConsumables) return new Error(ERROR_MESSAGES.ITEM.NOT_OWNED);

    const hasRequiredResources = CombatantProperties.hasRequiredResourcesToUseAction(
      combatantProperties,
      this.name,
      !!combatantContext.getBattleOption(),
      level
    );

    if (!hasRequiredResources)
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.INSUFFICIENT_RESOURCES);

    const isWearingRequiredEquipment = CombatantProperties.isWearingRequiredEquipmentToUseAction(
      combatantProperties,
      this.name
    );
    if (!isWearingRequiredEquipment)
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NOT_WEARING_REQUIRED_EQUIPMENT);

    // IF IN BATTLE, ONLY USE IF FIRST IN TURN ORDER
    let battleOption: null | Battle = null;
    if (party.battleId !== null) {
      const battle = game.battles[party.battleId];
      if (battle !== undefined) battleOption = battle;
      else return new Error(ERROR_MESSAGES.GAME.BATTLE_DOES_NOT_EXIST);
    }

    if (battleOption !== null) {
      const fastestActor = battleOption.turnOrderManager.getFastestActorTurnOrderTracker();
      if (fastestActor.combatantId !== combatant.entityProperties.id) {
        const message = `${ERROR_MESSAGES.COMBATANT.NOT_ACTIVE} first turn tracker ${JSON.stringify(fastestActor)}`;
        return new Error(message);
      }
    }

    const isInUsableContext = this.isUsableInThisContext(battleOption);
    if (!isInUsableContext)
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.INVALID_USABILITY_CONTEXT);

    // @TODO - TARGETS ARE NOT IN A PROHIBITED STATE
    // this would only make sense if we didn't already check valid states when targeting... unless
    // target state could change while they are already targeted, like if someone healed themselves
    // to full hp while someone else was targeting them with an autoinjector
  }
}

export class CombatActionLeaf extends CombatActionComponent {}
export class CombatActionComposite extends CombatActionComponent {
  protected children: CombatActionComponent[] = [];
  addChild: (childAction: CombatActionComponent) => void | Error = (
    childAction: CombatActionComponent
  ) => {
    this.children.push(childAction);
  };
}
