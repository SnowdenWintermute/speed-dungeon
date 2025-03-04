import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "../index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../../game-update-commands.js";
import {
  COMBAT_ACTIONS,
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
import { HitOutcome } from "../../../hit-outcome.js";
import { iterateNumericEnum } from "../../../utils/index.js";

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

    for (const flag of iterateNumericEnum(HitOutcome)) {
      for (const combatantId of outcomeFlags[flag] || []) {
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

    // @TODO - apply new conditions
    const conditionsToApply = action.getAppliedConditions(context);

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
    //
    return this.branchingActions;
  }
}
