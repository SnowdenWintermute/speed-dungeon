import {
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
  CombatActionHitOutcomes,
  CombatActionName,
  CombatActionTargetType,
  HitPointChanges,
  ResourceChange,
  ResourceChangeSource,
  ResourceChangeSourceCategory,
  ThreatChanges,
} from "../../../combat/index.js";
import { Combatant } from "../../../combatants/index.js";
import { AdventuringParty } from "../../../adventuring-party/index.js";
import { DurabilityChangesByEntityId } from "../../../durability/index.js";
import { addHitOutcomeDurabilityChanges } from "./hit-outcome-durability-change-calculators.js";
import { HitOutcome } from "../../../hit-outcome.js";
import { iterateNumericEnum } from "../../../utils/index.js";
import {
  COMBATANT_CONDITION_CONSTRUCTORS,
  CombatantCondition,
  MAX_CONDITION_STACKS,
} from "../../../combatants/combatant-conditions/index.js";
import { addConditionToUpdate } from "./add-condition-to-update.js";
import {
  addRemovedConditionIdToUpdate,
  addRemovedConditionStacksToUpdate,
} from "./add-triggered-condition-to-update.js";
import { CombatActionResource } from "../../../combat/combat-actions/combat-action-hit-outcome-properties.js";
import { MaxAndCurrent } from "../../../primatives/max-and-current.js";

const stepType = ActionResolutionStepType.EvalOnHitOutcomeTriggers;
export class EvalOnHitOutcomeTriggersActionResolutionStep extends ActionResolutionStep {
  branchingActions: { user: Combatant; actionExecutionIntent: CombatActionExecutionIntent }[] = [];
  constructor(context: ActionResolutionStepContext) {
    const gameUpdateCommand: ActivatedTriggersGameUpdateCommand = {
      type: GameUpdateCommandType.ActivatedTriggers,
      actionName: context.tracker.actionExecutionIntent.actionName,
      step: stepType,
      completionOrderId: null,
    };
    super(stepType, context, gameUpdateCommand);
    const { tracker, combatantContext } = this.context;
    const { actionExecutionIntent } = tracker;
    const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];
    const { game, party, combatant } = combatantContext;
    const battleOption = AdventuringParty.getBattleOption(party, game);
    const { outcomeFlags, resourceChanges } = tracker.hitOutcomes;

    const durabilityChanges = new DurabilityChangesByEntityId();

    if (!durabilityChanges.isEmpty()) {
      gameUpdateCommand.durabilityChanges = durabilityChanges;
      DurabilityChangesByEntityId.ApplyToGame(game, durabilityChanges);
    }

    // HANDLE TRIGGERED HIT POINT CHANGES

    const triggeredHitPointChanges = new HitPointChanges();
    let accumulatedLifeStolenResourceChange: null | ResourceChange = null;
    const hpChanges = resourceChanges && resourceChanges[CombatActionResource.HitPoints];
    if (hpChanges) {
      for (const [entityId, hpChange] of hpChanges.getRecords()) {
        if (hpChange.source.lifestealPercentage !== undefined) {
          const lifestealValue = Math.max(
            1,
            hpChange.value * (hpChange.source.lifestealPercentage / 100) * -1
          );

          if (!accumulatedLifeStolenResourceChange) {
            accumulatedLifeStolenResourceChange = new ResourceChange(
              lifestealValue,
              new ResourceChangeSource({ category: ResourceChangeSourceCategory.Magical })
            );
            accumulatedLifeStolenResourceChange.isCrit = hpChange.isCrit;
            accumulatedLifeStolenResourceChange.value = lifestealValue;
          } else {
            // if aggregating lifesteal from multiple hits, call it a crit if any of the hits were crits
            if (hpChange.isCrit) accumulatedLifeStolenResourceChange.isCrit = true;
            accumulatedLifeStolenResourceChange.value += lifestealValue;
          }
        }
      }
    }

    // @TODO - change triggered hp changes to an array since the same action might damage the user
    // but also result in a separate lifesteal on the user
    if (accumulatedLifeStolenResourceChange) {
      accumulatedLifeStolenResourceChange.value = Math.floor(
        accumulatedLifeStolenResourceChange.value
      );
      const existingHitPointChangeOption = triggeredHitPointChanges.getRecord(
        combatant.entityProperties.id
      );
      if (existingHitPointChangeOption)
        existingHitPointChangeOption.value += accumulatedLifeStolenResourceChange.value;
      else
        triggeredHitPointChanges.addRecord(
          combatant.entityProperties.id,
          accumulatedLifeStolenResourceChange
        );
    }

    // @TODO - calculate Death flags for these hp changes
    triggeredHitPointChanges.applyToGame(this.context.combatantContext);

    if (triggeredHitPointChanges.getRecords().length > 0) {
      gameUpdateCommand.hitPointChanges = triggeredHitPointChanges;

      // because threat change caluclation takes a hitOutcomeProperties we'll
      // create an ephemeral one here
      const wrappedLifestealHitPointChanges = new CombatActionHitOutcomes();
      if (!wrappedLifestealHitPointChanges.resourceChanges)
        wrappedLifestealHitPointChanges.resourceChanges = {};
      wrappedLifestealHitPointChanges.resourceChanges[CombatActionResource.HitPoints] =
        triggeredHitPointChanges;
      const threatChangesOption = action.hitOutcomeProperties.getThreatChangesOnHitOutcomes(
        context,
        wrappedLifestealHitPointChanges
      );

      if (threatChangesOption) {
        threatChangesOption.applyToGame(context.combatantContext.party);
        gameUpdateCommand.threatChanges = threatChangesOption;
      }
    }

    // HANDLE HIT OUTCOME FLAGS

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
          combatant,
          actionExecutionIntent.level,
          targetCombatant,
          action,
          flag,
          hpChangeIsCrit
        );

        if (flag === HitOutcome.Hit) {
          for (const condition of targetCombatant.combatantProperties.conditions) {
            if (!condition.triggeredWhenHitBy(actionExecutionIntent.actionName)) continue;

            const { numStacksRemoved, triggeredActions } = condition.onTriggered(
              combatantContext,
              targetCombatant,
              context.idGenerator
            );

            CombatantCondition.removeStacks(
              condition.id,
              combatantResult.combatantProperties,
              numStacksRemoved
            );

            this.branchingActions.push(
              ...triggeredActions.filter((actionIntent) => {
                const action = COMBAT_ACTIONS[actionIntent.actionExecutionIntent.actionName];
                action.shouldExecute(
                  context.combatantContext,
                  tracker.getPreviousTrackerInSequenceOption() || undefined
                );
              })
            );

            // add it to the update so the client can remove the triggered conditions if required
            if (numStacksRemoved)
              addRemovedConditionStacksToUpdate(
                condition.id,
                numStacksRemoved,
                gameUpdateCommand,
                targetCombatant.entityProperties.id
              );
          }

          const conditionsToApply = action.hitOutcomeProperties.getAppliedConditions(
            context.combatantContext.combatant,
            context.tracker.actionExecutionIntent.level
          );

          if (conditionsToApply) {
            for (const conditionProperties of conditionsToApply) {
              const condition = new COMBATANT_CONDITION_CONSTRUCTORS[
                conditionProperties.conditionName
              ](
                context.idGenerator.generate(),
                conditionProperties.appliedBy,
                conditionProperties.level,
                new MaxAndCurrent(MAX_CONDITION_STACKS, conditionProperties.stacks)
              );

              CombatantCondition.applyToCombatant(condition, targetCombatant, battleOption, party);

              addConditionToUpdate(
                condition,
                gameUpdateCommand,
                targetCombatant.entityProperties.id,
                HitOutcome.Hit
              );
            }

            battleOption?.turnOrderManager.updateTrackers(game, party);
          }
        }

        if (flag === HitOutcome.Death) {
          for (const condition of targetCombatant.combatantProperties.conditions) {
            if (!condition.removedOnDeath) continue;
            CombatantCondition.removeById(condition.id, combatantResult.combatantProperties);
            battleOption?.turnOrderManager.updateTrackers(game, party);
            addRemovedConditionIdToUpdate(
              condition.id,
              gameUpdateCommand,
              targetCombatant.entityProperties.id
            );
          }

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
          targetCombatant.combatantProperties.combatActionTarget = {
            type: CombatActionTargetType.Single,
            targetId: combatant.entityProperties.id,
          };

          this.branchingActions.push({
            user: targetCombatant,
            actionExecutionIntent: new CombatActionExecutionIntent(
              CombatActionName.Counterattack,
              {
                type: CombatActionTargetType.Single,
                targetId: combatant.entityProperties.id,
              },
              1
            ),
          });
        }
      }
    }
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;

  getBranchingActions():
    | Error
    | { user: Combatant; actionExecutionIntent: CombatActionExecutionIntent }[] {
    const toReturn = this.branchingActions;
    return toReturn;
  }
}
