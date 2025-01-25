import { AdventuringParty } from "../../adventuring-party/index.js";
import { Battle } from "../../battle/index.js";
import { Combatant } from "../../combatants/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { EntityId } from "../../primatives/index.js";
import { COMBAT_ACTIONS } from "../combat-actions/action-implementations/index.js";
import {
  CombatActionComponent,
  CombatActionName,
  CombatActionTarget,
  CombatActionTargetType,
  FriendOrFoe,
  TargetCategories,
  TargetingScheme,
} from "../index.js";
import {
  ActionTargetPair,
  EvaluatedActionTargetPair,
} from "./custom-nodes/set-available-targets-and-usable-actions.js";

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
  public usableActionNames: CombatActionName[] = [];
  public consideredTargetCombatants: Combatant[] = [];
  public consideredActionTargetPairs: ActionTargetPair[] = [];
  public evaluatedActionTargetPairs: EvaluatedActionTargetPair[] = [];
  private selectedActionAndTargets: ActionTargetPair | null = null;
  constructor(
    public combatant: Combatant,
    public game: SpeedDungeonGame,
    public party: AdventuringParty,
    public battleOption: Battle | null // allow for ally AI controlled combatants doing things outside of combat
  ) {}

  setConsideredActionTargetPairs(actionName: CombatActionName): Error | void {
    const action = COMBAT_ACTIONS[actionName];
    for (const targetingScheme of action.targetingSchemes) {
      switch (targetingScheme) {
        case TargetingScheme.Single:
          this.setConsideredSingleTargets(action);
          break;
        case TargetingScheme.Area:
          this.setConsideredGroupTargets(action);
          break;
        case TargetingScheme.All:
          const allTarget: CombatActionTarget = { type: CombatActionTargetType.All };
          this.consideredActionTargetPairs.push({ actionName, targets: allTarget });
      }
    }
  }

  setConsideredSingleTargets(action: CombatActionComponent) {
    for (const potentialTarget of this.consideredTargetCombatants) {
      const shouldEvaluate = action.combatantIsValidTarget(
        this.combatant,
        potentialTarget,
        this.battleOption
      );

      console.log("combatant is valid target: ", shouldEvaluate);

      if (!shouldEvaluate) continue;

      const targets: CombatActionTarget = {
        type: CombatActionTargetType.Single,
        targetId: potentialTarget.entityProperties.id,
      };

      this.consideredActionTargetPairs.push({
        actionName: action.name,
        targets,
      });
    }
  }

  setConsideredGroupTargets(action: CombatActionComponent) {
    if (!action.targetingSchemes.includes(TargetingScheme.Area)) return;
    const friendlyGroup: ActionTargetPair = {
      actionName: action.name,
      targets: {
        type: CombatActionTargetType.Group,
        friendOrFoe: FriendOrFoe.Hostile,
      },
    };
    const hostileGroup: ActionTargetPair = {
      actionName: action.name,
      targets: {
        type: CombatActionTargetType.Group,
        friendOrFoe: FriendOrFoe.Hostile,
      },
    };

    switch (action.validTargetCategories) {
      case TargetCategories.Opponent:
        this.consideredActionTargetPairs.push(hostileGroup);
        break;
      case TargetCategories.User:
        break;
      case TargetCategories.Friendly:
        this.consideredActionTargetPairs.push(friendlyGroup);
        break;
      case TargetCategories.Any:
        this.consideredActionTargetPairs.push(hostileGroup);
        this.consideredActionTargetPairs.push(friendlyGroup);
        break;
    }
  }
}
