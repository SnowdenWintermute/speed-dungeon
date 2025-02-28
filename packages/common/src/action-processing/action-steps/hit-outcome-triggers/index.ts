import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "../index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../../game-update-commands.js";
import {
  COMBAT_ACTIONS,
  CombatActionExecutionIntent,
  HitOutcome,
  calculateActionDurabilityChangesOnHit,
} from "../../../combat/index.js";
import { Combatant } from "../../../combatants/index.js";
import { AdventuringParty } from "../../../adventuring-party/index.js";
import { DurabilityChangesByEntityId } from "../../../durability/index.js";

const stepType = ActionResolutionStepType.EvalOnHitOutcomeTriggers;
export class EvalOnHitOutcomeTriggersActionResolutionStep extends ActionResolutionStep {
  branchingActions: { user: Combatant; actionExecutionIntent: CombatActionExecutionIntent }[] = [];
  constructor(context: ActionResolutionStepContext) {
    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.ActivatedTriggers,
      step: stepType,
      completionOrderId: null,
    };
    super(stepType, context, gameUpdateCommand);
    const { tracker, combatantContext } = this.context;
    const { actionExecutionIntent } = tracker;
    const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];
    const { party, combatant } = combatantContext;
    const { outcomeFlags, hitPointChanges } = tracker.hitOutcomes;

    const durabilityChanges = new DurabilityChangesByEntityId();

    for (const combatantId of outcomeFlags[HitOutcome.Hit] || []) {
      const combatantResult = AdventuringParty.getCombatant(party, combatantId);
      if (combatantResult instanceof Error) throw combatantResult;
      const targetCombatant = combatantResult;

      const hpChangeIsCrit = (() => {
        if (!hitPointChanges) return false;
        return !!hitPointChanges[combatantId]?.isCrit;
      })();

      calculateActionDurabilityChangesOnHit(
        combatant,
        targetCombatant,
        action,
        true,
        hpChangeIsCrit,
        durabilityChanges
      );

      // @TODO -trigger on-hit conditions
      for (const condition of combatantResult.combatantProperties.conditions) {
        if (!condition.triggeredWhenHitBy(actionExecutionIntent.actionName)) continue;
        // const triggeredActions = condition.onTriggered();
        // figure out the "user" for actions that originate from no combatant in particular
      }
    }
    //
    //
    // determine durability loss of target's armor and user's weapon
    // @TODO - move this to hit outcome triggers step
    // calculateActionDurabilityChangesOnHit(
    //   combatant,
    //   targetCombatantResult,
    //   action,
    //   true,
    //   hpChange.isCrit,
    //   durabilityChanges
    // );
    //
    //
    // apply lifesteal trait
    // determine if hp change source has lifesteal
    // get the percent
    // add it to the lifesteal hp change of the action user
    // if (hpChange.source.lifestealPercentage) {
    //   const lifestealValue = hpChange.value * (hpChange.source.lifestealPercentage / 100) * -1;
    //   if (!lifestealHpChange) {
    //     lifestealHpChange = new HpChange(
    //       lifestealValue,
    //       new HpChangeSource({ category: HpChangeSourceCategory.Magical })
    //     );
    //     lifestealHpChange.isCrit = hpChange.isCrit;
    //     lifestealHpChange.value = lifestealValue;
    //   } else {
    //     // if aggregating lifesteal from multiple hits, call it a crit if any of the hits were crits
    //     if (hpChange.isCrit) lifestealHpChange.isCrit = true;
    //     lifestealHpChange.value += lifestealValue;
    //   }
    // }

    // if (lifestealHpChange) {
    // lifestealHpChange.value = Math.floor(lifestealHpChange.value);
    // hitPointChanges[combatant.entityProperties.id] = lifestealHpChange;
    // }
    // read expected hits, misses, evades, parries, blocks (used for determining triggers as well as user followthrough animation)
    // from blackboard
    // CALCULATE AND COLLECT THE FOLLOWING:
    // hp changes, mp changes, durability changes, misses, evades, parries, counters, blocks
    // CALCULATION ORDER
    // miss
    // - client shows miss text
    // evade
    // - client plays evade animation on target entity
    // parry
    // - client plays parry animation on target entity
    // - notify next step of the parry so if the ability calls for it,
    //   server sends instruction in recoveryMotion that user should play a hit-interrupted animation for the followthrough
    // counter
    // - start a branching "counterattack" action on the target entity
    // - notify next step of the counter so if the ability calls for it,
    //   server sends instruction in recoveryMotion that user should play a hit-interrupted animation for the followthrough
    //   and also remain in place long enough to be hit by the counter attack
    // block
    // - client plays block animation on target entity
    // - notify next step of the block so if the ability calls for it,
    // server sends instruction in recoveryMotion that user should play a hit-interrupted animation for the followthrough
    //
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;

  getBranchingActions():
    | Error
    | { user: Combatant; actionExecutionIntent: CombatActionExecutionIntent }[] {
    //
    return this.branchingActions;
  }
}
