import { AdventuringParty } from "../../adventuring-party/index.js";
import { Battle } from "../../battle/index.js";
import { ActionUserContext } from "../../combatant-context/action-user.js";
import { CombatantContext } from "../../combatant-context/index.js";
import { Combatant } from "../../combatants/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { EntityId } from "../../primatives/index.js";
import { CombatActionExecutionIntent } from "../combat-actions/combat-action-execution-intent.js";
import {
  COMBAT_ACTIONS,
  CombatActionComponent,
  CombatActionName,
  CombatActionTarget,
  CombatActionTargetType,
  FriendOrFoe,
  TargetCategories,
  TargetingScheme,
} from "../index.js";
import { PotentialTotalHealingEvaluation } from "./custom-nodes/collect-potential-healing-from-considered-actions.js";

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

export enum AIFriendlyTargetSelectionScheme {
  // attemts to heal any ally with hp below a defined threshold
  Healer,
  // attemts to keep all known buffs active on all allies
  Buffer,
}

export class AIBehaviorContext {
  public consideredCombatants: Combatant[] = [];
  public currentCombatantConsidering: null | Combatant = null;
  public consideredActionNamesFilteredByIntents: CombatActionName[] = [];
  public currentActionNameConsidering: CombatActionName | null = null;
  public currentActionLevelConsidering: null | number = null;
  public usableActionsWithPotentialValidTargets: Partial<
    Record<CombatActionName, CombatActionTarget[]>
  > = {};
  public selectedActionWithPotentialValidTargets: null | {
    actionName: CombatActionName;
    potentialValidTargets: CombatActionTarget[];
  } = null;

  public consideredActionIntents: {
    intent: CombatActionExecutionIntent;
    healingEvaluation: PotentialTotalHealingEvaluation;
  }[] = [];
  public selectedActionIntent: null | CombatActionExecutionIntent = null;

  constructor(
    public actionUserContext: ActionUserContext,
    public battleOption: Battle | null // allow for ally AI controlled combatants doing things outside of combat
  ) {}
  getCurrentActionLevelConsidering() {
    return this.currentActionLevelConsidering;
  }
  setCurrentActionLevelConsidering(level: number) {
    this.currentActionLevelConsidering = level;
  }

  getCurrentActionNameConsidering() {
    return this.currentActionNameConsidering;
  }
  setCurrentActionNameConsidering(actionName: CombatActionName) {
    this.currentActionNameConsidering = actionName;
  }

  setCurrentCombatantConsidering(combatant: Combatant) {
    this.currentCombatantConsidering = combatant;
  }

  setConsideredCombatants(combatants: Combatant[]) {
    this.consideredCombatants = combatants;
  }
  getConsideredCombatants() {
    return this.consideredCombatants;
  }
}
