import { AdventuringParty } from "../../adventuring-party/index.js";
import { Battle } from "../../battle/index.js";
import { Combatant } from "../../combatants/index.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { EntityId } from "../../primatives/index.js";
import {
  CombatAction,
  CombatActionProperties,
  CombatActionTarget,
  CombatActionTargetType,
  FriendOrFoe,
  TargetCategories,
  TargetingScheme,
} from "../index.js";
import { EvaluatedActionTargetPair } from "./custom-nodes/set-available-targets-and-usable-actions.js";

export enum AIActionSelectionScheme {
  Basic,
  Protective,
}

export enum AIHostileTargetSelectionScheme {
  // chooses random targets
  Random,
  // attacks the target which has the most combined:
  // - damage on the targeter
  // - total healing done
  // - total threat from other actions such as casting buffs
  Enmity,
  // attacks the target which it will do the highest average damage to
  Opportinist,
  // attacks the target with the lowest HP
  SimpleExploiter,
  // attacks the target which it has the highest chance of bringing to the lowest HP
  // in other words, it takes into account both the lowness of their HP and the damage
  // which can be done to them. If there is a highly protected target with low HP, it won't
  // be preferred to a higher hp target with low protection if that target can be reduced to a lower HP
  // on average by the targeting combatant's attack
  IntelligentExploiter,
  // attacks the target which the attacker and its allies have the highest chance of killing
  // before the target gets their next turn
  Strategist,
}

export class AIBehaviorContext {
  private actionSelectionScheme: AIActionSelectionScheme = AIActionSelectionScheme.Basic;
  private hostileTargetSelectionScheme: AIHostileTargetSelectionScheme =
    AIHostileTargetSelectionScheme.Enmity;
  private enmityList: { combatantId: EntityId; enmity: number }[] = [];
  public usableActions: CombatAction[] = [];
  public consideredTargets: Combatant[] = [];
  public usableActionsAndValidTargets:
    | {
        action: CombatAction;
        targets: CombatActionTarget;
      }[]
    | null = null;
  public evaluatedActionTargetPairs: EvaluatedActionTargetPair[] = [];
  private selectedActionAndTargets: {
    combatAction: CombatAction;
    targets: CombatActionTarget;
  } | null = null;
  constructor(
    public combatant: Combatant,
    public game: SpeedDungeonGame,
    public party: AdventuringParty,
    public battleOption: Battle | null // allow for ally AI controlled combatants doing things outside of combat
  ) {}

  evaluateActionOnPotentialSingleTargets(
    action: CombatAction,
    actionProperties: CombatActionProperties,
    evaluateActionTargetPair: (
      context: AIBehaviorContext,
      action: CombatAction,
      target: CombatActionTarget
    ) => Error | number
  ): Error | void {
    if (!actionProperties.targetingSchemes.includes(TargetingScheme.Single))
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.INVALID_TARGETS_SELECTED);
    for (const potentialTarget of this.consideredTargets) {
      const shouldEvaluate = actionProperties.combatantIsValidTarget(
        this.combatant,
        potentialTarget,
        this.battleOption
      );

      if (!shouldEvaluate) continue;

      const targets: CombatActionTarget = {
        type: CombatActionTargetType.Single,
        targetId: potentialTarget.entityProperties.id,
      };

      const effectivenessResult = evaluateActionTargetPair(this, action, targets);

      if (effectivenessResult instanceof Error) return effectivenessResult;

      this.evaluatedActionTargetPairs.push({
        action,
        targets,
        effectiveness: effectivenessResult,
      });
    }
  }

  evaluateActionOnPotentialGroupTargets(
    action: CombatAction,
    actionProperties: CombatActionProperties,
    evaluateActionTargetPair: (
      context: AIBehaviorContext,
      action: CombatAction,
      target: CombatActionTarget
    ) => Error | number
  ) {
    if (!actionProperties.targetingSchemes.includes(TargetingScheme.Area)) return;
    const potentialTargets: CombatActionTarget[] = [];
    switch (actionProperties.validTargetCategories) {
      case TargetCategories.Opponent:
        potentialTargets.push({
          type: CombatActionTargetType.Group,
          friendOrFoe: FriendOrFoe.Hostile,
        });
        break;
      case TargetCategories.User:
        break;
      case TargetCategories.Friendly:
        potentialTargets.push({
          type: CombatActionTargetType.Group,
          friendOrFoe: FriendOrFoe.Hostile,
        });
        break;
      case TargetCategories.Any:
        potentialTargets.push({
          type: CombatActionTargetType.Group,
          friendOrFoe: FriendOrFoe.Hostile,
        });
        potentialTargets.push({
          type: CombatActionTargetType.Group,
          friendOrFoe: FriendOrFoe.Hostile,
        });
        break;
    }
  }
}
