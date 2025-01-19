import { AdventuringParty } from "../../../adventuring-party/index.js";
import { Combatant, CombatantProperties } from "../../../combatants/index.js";
import { CombatAction, CombatActionTarget, TargetingScheme } from "../../index.js";
import { AIBehaviorContext } from "../ai-context.js";
import { BehaviorLeaf, BehaviorNode, Sequence } from "../behavior-tree.js";

// get all actions that the user meets the cost requirements to perform and pass the provided condition (is healing, is damage)
// for each action, get the valid targets that exist
// - for each targeting scheme, iterate possibilities
// - check if action can be used on the target (if single is dead || all in group are dead && can't use on dead, don't add to list)
// set the action/targets pair as an option to consider
//
export interface ActionTargetPair {
  action: CombatAction;
  targets: CombatActionTarget;
}

export interface EvaluatedActionTargetPair {
  effectiveness: number;
  pair: ActionTargetPair;
}

export class SetAvailableTargetsAndUsableActions implements BehaviorNode {
  constructor(
    private context: AIBehaviorContext,
    // action would be desired for this type of behavior (a healing spell for a healing behavior)
    private isSuitableAction: (action: CombatAction) => boolean,
    // target should be considered (ally with low hp for a healing behavior)
    private shouldConsiderCombatantAsTarget: (
      context: AIBehaviorContext,
      target: Combatant
    ) => boolean,
    // determine how effective this action/target pair would be based on intentions
    // (lowest hp target brought to highest hp, most positive hp change on allies, enemy target brought to lowest hp, most debuffs removed)
    private getActionPreferenceScoreOnTargets: (
      context: AIBehaviorContext,
      action: CombatAction,
      target: CombatActionTarget
    ) => Error | number
  ) {}
  execute(): boolean {
    const sequence = new Sequence([
      // collect a list of usable actions
      new BehaviorLeaf(() => {
        let listOfUsableActions: CombatAction[] = [];
        const { combatant } = this.context;
        const usableActions = CombatantProperties.getAllUsableActions(
          combatant.combatantProperties,
          !!this.context.battleOption
        );

        console.log("usable before filter: ", usableActions);

        listOfUsableActions = usableActions.filter(this.isSuitableAction);

        console.log("usable actions: ", listOfUsableActions);

        if (listOfUsableActions.length) {
          this.context.usableActions = usableActions;
          return true;
        } else return false;
      }),

      // collect a list of considered targets based on the user's "intentions"
      // (only low hp allies, allies with debuffs to remove, enemies with buffs to dispell)
      new BehaviorLeaf(() => {
        const party = this.context.party;
        const combatantsInParty = AdventuringParty.getAllCombatants(party);
        const { monsters, characters } = combatantsInParty;
        const combatantsList = Object.values(monsters).concat(Object.values(characters));

        const filteredTargets = combatantsList.filter((combatant) =>
          this.shouldConsiderCombatantAsTarget(this.context, combatant)
        );

        console.log("filtered targets: ", filteredTargets.length);

        if (filteredTargets.length) {
          this.context.consideredTargetCombatants = filteredTargets;
          return true;
        } else return false;
      }),
      // collect all possible action/target pairs
      new BehaviorLeaf(() => {
        if (!this.context.consideredTargetCombatants.length) return false;

        for (const action of this.context.usableActions) {
          const actionPropertiesResult = CombatantProperties.getCombatActionPropertiesIfOwned(
            this.context.combatant.combatantProperties,
            action
          );
          if (actionPropertiesResult instanceof Error) {
            console.trace(actionPropertiesResult);
            return false;
          }
          const maybeError = this.context.setConsideredActionTargetPairs(
            action,
            actionPropertiesResult
          );
          if (maybeError instanceof Error) {
            console.trace(maybeError);
            return false;
          }
        }

        return true;
      }),
      // determine the most effective action/target pair
      // effectiveness may be determined by things such as "valid target with higest threat score",
      // "most hp healed on lowest hp ally", "any enemy brought to lowest hp" or "most total damage done"
      new BehaviorLeaf(() => {
        return true;
      }),
    ]);

    return sequence.execute();
  }
}
