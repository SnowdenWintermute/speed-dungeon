import {
  ActionIntentAndUser,
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "../index.js";
import {
  ActivatedTriggersGameUpdateCommand,
  GameUpdateCommandType,
} from "../../game-update-commands.js";
import {
  COMBAT_ACTIONS,
  CombatActionExecutionIntent,
  CombatActionName,
  CombatActionTargetType,
  ThreatChanges,
} from "../../../combat/index.js";
import { AdventuringParty } from "../../../adventuring-party/index.js";
import { DurabilityChangesByEntityId } from "../../../durability/index.js";
import { addHitOutcomeDurabilityChanges } from "./hit-outcome-durability-change-calculators.js";
import { HitOutcome } from "../../../hit-outcome.js";
import { iterateNumericEnum } from "../../../utils/index.js";
import { CombatantCondition } from "../../../combatants/combatant-conditions/index.js";
import { addRemovedConditionIdToUpdate } from "./add-triggered-condition-to-update.js";
import { handleTriggeredLifesteals } from "./handle-triggered-lifesteals.js";
import { handleHit } from "./handle-hit.js";

const stepType = ActionResolutionStepType.EvalOnHitOutcomeTriggers;
export class EvalOnHitOutcomeTriggersActionResolutionStep extends ActionResolutionStep {
  branchingActions: ActionIntentAndUser[] = [];
  constructor(context: ActionResolutionStepContext) {
    const gameUpdateCommand: ActivatedTriggersGameUpdateCommand = {
      type: GameUpdateCommandType.ActivatedTriggers,
      actionName: context.tracker.actionExecutionIntent.actionName,
      step: stepType,
      completionOrderId: null,
    };
    super(stepType, context, gameUpdateCommand);
    const { tracker, actionUserContext } = this.context;
    const { actionExecutionIntent } = tracker;
    const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];
    const { game, party, actionUser } = actionUserContext;
    const battleOption = AdventuringParty.getBattleOption(party, game);
    const { outcomeFlags } = tracker.hitOutcomes;

    const customTriggers = action.hitOutcomeProperties.getHitOutcomeTriggers(context);
    Object.assign(gameUpdateCommand, customTriggers);

    // @REFACTOR - split into smaller functions and make the step just orchestrate

    const hpChanges = handleTriggeredLifesteals(this.context, gameUpdateCommand);

    // HANDLE HIT OUTCOME FLAGS

    const durabilityChanges = new DurabilityChangesByEntityId();
    for (const flag of iterateNumericEnum(HitOutcome)) {
      for (const combatantId of outcomeFlags[flag] || []) {
        const combatantResult = AdventuringParty.getCombatant(party, combatantId);
        if (combatantResult instanceof Error) throw combatantResult;
        const targetCombatant = combatantResult;

        const hpChangeIsCrit = (() => {
          if (!hpChanges) return false;
          return !!hpChanges.getRecord(combatantId)?.isCrit;
        })();

        addHitOutcomeDurabilityChanges(
          durabilityChanges,
          actionUser,
          actionExecutionIntent.rank,
          targetCombatant,
          action,
          flag,
          hpChangeIsCrit
        );

        if (flag === HitOutcome.Hit) {
          const branchingActionsFromHit = handleHit(context, targetCombatant, gameUpdateCommand);
          this.branchingActions.push(...branchingActionsFromHit);
        }

        if (flag === HitOutcome.Death) {
          for (const condition of targetCombatant.combatantProperties.conditions) {
            if (!condition.removedOnDeath) continue;
            CombatantCondition.removeById(condition.id, combatantResult.combatantProperties);
            addRemovedConditionIdToUpdate(
              condition.id,
              gameUpdateCommand,
              targetCombatant.entityProperties.id
            );
          }

          battleOption?.turnOrderManager.updateTrackers(game, party);

          let { threatChanges } = gameUpdateCommand;
          if (threatChanges === undefined) threatChanges = new ThreatChanges();

          for (const [monsterId, monster] of Object.entries(party.currentRoom.monsters)) {
            const { threatManager } = monster.combatantProperties;
            if (!threatManager) continue;
            threatChanges.addEntryToRemove(monsterId, targetCombatant.entityProperties.id);
          }

          if (
            gameUpdateCommand.threatChanges === undefined &&
            Object.values(threatChanges.getEntriesToRemove()).length !== 0
          )
            gameUpdateCommand.threatChanges = threatChanges;
        }

        if (flag === HitOutcome.Counterattack) {
          // We set their target because of how auto targeting works by checking their selected target
          // but it would be nicer if we could force a certain targetId from the actionExecutionIntent
          // since maybe there would be a bunch of counterattacks queued up. For now though, there isn't.
          targetCombatant.combatantProperties.targetingProperties.setSelectedTarget({
            type: CombatActionTargetType.Single,
            targetId: actionUser.getEntityId(),
          });

          this.branchingActions.push({
            user: targetCombatant,
            actionExecutionIntent: new CombatActionExecutionIntent(
              CombatActionName.Counterattack,
              1,
              {
                type: CombatActionTargetType.Single,
                targetId: actionUser.getEntityId(),
              }
            ),
          });
        }
      }
    }

    if (!durabilityChanges.isEmpty()) {
      gameUpdateCommand.durabilityChanges = durabilityChanges;
      DurabilityChangesByEntityId.ApplyToGame(party, durabilityChanges);
    }
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;

  getBranchingActions(): Error | ActionIntentAndUser[] {
    const toReturn = this.branchingActions;
    return toReturn;
  }
}
