import { AdventuringParty } from "../../../adventuring-party/index.js";
import { Battle } from "../../../battle/index.js";
import { Combatant, CombatantProperties } from "../../../combatants/index.js";
import {
  CombatAction,
  CombatActionProperties,
  CombatActionTarget,
  CombatActionTargetType,
  TargetCategories,
  TargetingScheme,
} from "../../index.js";
import { AIBehaviorContext } from "../ai-context.js";
import { BehaviorLeaf, BehaviorNode, Sequence } from "../behavior-tree.js";

// get all actions that the user meets the cost requirements to perform and pass the provided condition (is healing, is damage)
// for each action, get the valid targets that exist
// - for each targeting scheme, iterate possibilities
// - check if action can be used on the target (if single is dead || all in group are dead && can't use on dead, don't add to list)
// set the action/targets pair as an option to consider

export interface EvaluatedActionTargetPair {
  action: CombatAction;
  targets: CombatActionTarget;
  effectiveness: number;
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
    return new Sequence([
      // collect a list of usable actions
      new BehaviorLeaf(() => {
        let listOfUsableActions: CombatAction[] = [];
        const { combatant } = this.context;
        const usableActions = CombatantProperties.getAllUsableActions(
          combatant.combatantProperties,
          !!this.context.battleOption
        );

        listOfUsableActions = listOfUsableActions.filter(this.isSuitableAction);

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

        if (filteredTargets.length) {
          this.context.consideredTargets = filteredTargets;
          return true;
        } else return false;
      }),

      // determine the most effective action/target pair
      // effectiveness may be determined by things such as "valid target with higest threat score",
      // "most hp healed on lowest hp ally", "any enemy brought to lowest hp" or "most total damage done"
      new BehaviorLeaf(() => {
        if (!this.context.consideredTargets.length) return false;

        for (const action of this.context.usableActions) {
          const actionPropertiesResult = CombatantProperties.getCombatActionPropertiesIfOwned(
            this.context.combatant.combatantProperties,
            action
          );
          if (actionPropertiesResult instanceof Error) {
            console.trace(actionPropertiesResult);
            return false;
          }
          for (const targetingScheme of actionPropertiesResult.targetingSchemes) {
            switch (targetingScheme) {
              case TargetingScheme.Single:
                const maybeError = this.context.evaluateActionOnPotentialSingleTargets(
                  action,
                  actionPropertiesResult,
                  this.getActionPreferenceScoreOnTargets
                );
                if (maybeError instanceof Error) {
                  console.trace(maybeError);
                  return false;
                }
                break;
              case TargetingScheme.Area:
              case TargetingScheme.All:
            }
          }
        }
        // if (!potentialActionsAndTargets.length) return false;
        // this.context.usableActionsAndValidTargets = potentialActionsAndTargets;
        // set list in context
        return true;
      }),
    ]).execute();
  }
}
