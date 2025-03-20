import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "../index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../../game-update-commands.js";
import {
  COMBAT_ACTIONS,
  COMBAT_ACTION_NAME_STRINGS,
  CombatActionExecutionIntent,
  HitPointChanges,
  HpChange,
  HpChangeSource,
  HpChangeSourceCategory,
} from "../../../combat/index.js";
import { Combatant } from "../../../combatants/index.js";
import { AdventuringParty } from "../../../adventuring-party/index.js";
import { DurabilityChangesByEntityId } from "../../../durability/index.js";
import { addHitOutcomeDurabilityChanges } from "./hit-outcome-durability-change-calculators.js";
import { HIT_OUTCOME_NAME_STRINGS, HitOutcome } from "../../../hit-outcome.js";
import { iterateNumericEnum } from "../../../utils/index.js";
import {
  COMBATANT_CONDITION_NAME_STRINGS,
  CombatantCondition,
} from "../../../combatants/combatant-conditions/index.js";
import { addConditionToUpdate } from "./add-condition-to-update.js";
import { addRemovedConditionToUpdate } from "./add-triggered-condition-to-update.js";

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

    console.log("EvalOnHitOutcomeTriggers step for", COMBAT_ACTION_NAME_STRINGS[action.name]);

    const durabilityChanges = new DurabilityChangesByEntityId();

    for (const flag of iterateNumericEnum(HitOutcome)) {
      for (const combatantId of outcomeFlags[flag] || []) {
        console.log("combatant flagged by outcome:", combatantId, HIT_OUTCOME_NAME_STRINGS[flag]);
        const combatantResult = AdventuringParty.getCombatant(party, combatantId);
        if (combatantResult instanceof Error) throw combatantResult;
        const targetCombatant = combatantResult;

        const hpChangeIsCrit = (() => {
          if (!hitPointChanges) return false;
          return !!hitPointChanges.getRecord(combatantId)?.isCrit;
        })();

        addHitOutcomeDurabilityChanges(
          durabilityChanges,
          combatant,
          targetCombatant,
          action,
          flag,
          hpChangeIsCrit
        );

        if (flag === HitOutcome.Hit) {
          const conditionsToApply = action.getAppliedConditions(context);
          console.log("conditionsToApply: ", conditionsToApply);
          if (conditionsToApply)
            for (const condition of conditionsToApply) {
              CombatantCondition.applyToCombatant(condition, targetCombatant.combatantProperties);
              addConditionToUpdate(
                condition,
                gameUpdateCommand,
                targetCombatant.entityProperties.id,
                HitOutcome.Hit
              );
            }

          // // @TODO -trigger on-hit conditions
          for (const condition of combatantResult.combatantProperties.conditions) {
            console.log("has condition", COMBATANT_CONDITION_NAME_STRINGS[condition.name]);
            if (!condition.triggeredWhenHitBy(actionExecutionIntent.actionName)) continue;

            // ENVIRONMENT_COMBATANT is the "user" for actions that originate from no combatant in particular
            const { removedSelf, triggeredActions } = condition.onTriggered(targetCombatant);
            this.branchingActions.push(...triggeredActions);
            console.log(
              "triggered actions: ",
              triggeredActions.map(
                (action) => COMBAT_ACTION_NAME_STRINGS[action.actionExecutionIntent.actionName]
              )
            );

            // add it to the update so the client can remove the triggered conditions if required
            if (removedSelf)
              addRemovedConditionToUpdate(
                condition.id,
                gameUpdateCommand,
                targetCombatant.entityProperties.id
              );
          }
        }
      }
    }

    gameUpdateCommand.durabilityChanges = durabilityChanges;

    const triggeredHitPointChanges = new HitPointChanges();
    let accumulatedLifeStolenHpChange: null | HpChange = null;
    if (tracker.hitOutcomes.hitPointChanges) {
      for (const [entityId, hpChange] of tracker.hitOutcomes.hitPointChanges.getRecords()) {
        if (hpChange.source.lifestealPercentage !== undefined) {
          const lifestealValue = Math.max(
            1,
            hpChange.value * (hpChange.source.lifestealPercentage / 100) * -1
          );

          if (!accumulatedLifeStolenHpChange) {
            accumulatedLifeStolenHpChange = new HpChange(
              lifestealValue,
              new HpChangeSource({ category: HpChangeSourceCategory.Magical })
            );
            accumulatedLifeStolenHpChange.isCrit = hpChange.isCrit;
            accumulatedLifeStolenHpChange.value = lifestealValue;
          } else {
            // if aggregating lifesteal from multiple hits, call it a crit if any of the hits were crits
            if (hpChange.isCrit) accumulatedLifeStolenHpChange.isCrit = true;
            accumulatedLifeStolenHpChange.value += lifestealValue;
          }
        }
      }
    }

    // @TODO - change triggered hp changes to an array since the same action might damage the user
    // but also result in a separate lifesteal on the user
    if (accumulatedLifeStolenHpChange) {
      accumulatedLifeStolenHpChange.value = Math.floor(accumulatedLifeStolenHpChange.value);
      const existingHitPointChangeOption = triggeredHitPointChanges.getRecord(
        combatant.entityProperties.id
      );
      if (existingHitPointChangeOption)
        existingHitPointChangeOption.value += accumulatedLifeStolenHpChange.value;
      else
        triggeredHitPointChanges.addRecord(
          combatant.entityProperties.id,
          accumulatedLifeStolenHpChange
        );
    }

    triggeredHitPointChanges.applyToGame(this.context.combatantContext);
    if (triggeredHitPointChanges.getRecords().length > 0)
      gameUpdateCommand.hitPointChanges = triggeredHitPointChanges;

    // // @TODO -trigger on-hit conditions
    // for (const condition of combatantResult.combatantProperties.conditions) {
    //   if (!condition.triggeredWhenHitBy(actionExecutionIntent.actionName)) continue;
    //   // const triggeredActions = condition.onTriggered();
    //   // figure out the "user" for actions that originate from no combatant in particular
    // }

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
    return this.branchingActions;
  }
}
