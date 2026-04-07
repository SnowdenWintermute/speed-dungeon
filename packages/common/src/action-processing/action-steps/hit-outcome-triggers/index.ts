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

import { DurabilityChangesByEntityId } from "../../../durability/index.js";
import { addHitOutcomeDurabilityChanges } from "./hit-outcome-durability-change-calculators.js";
import { HitOutcome } from "../../../hit-outcome.js";
import { iterateNumericEnum } from "../../../utils/index.js";
import { addRemovedConditionIdToUpdate } from "./add-triggered-condition-to-update.js";
import { handleTriggeredLifesteals } from "./handle-triggered-lifesteals.js";
import { handleHit } from "./handle-hit.js";
import { ActionAndRank } from "../../../action-user-context/action-user-targeting-properties.js";
import { Combatant } from "../../../combatants/index.js";
import {
  ActionRank,
  AdventuringParty,
  COMBAT_ACTIONS,
  CombatActionExecutionIntent,
  CombatActionName,
  CombatActionTargetType,
  CombatantId,
  ThreatChanges,
} from "../../../index.js";

const stepType = ActionResolutionStepType.EvalOnHitOutcomeTriggers;
export class EvalOnHitOutcomeTriggersActionResolutionStep extends ActionResolutionStep {
  branchingActions: ActionIntentAndUser[] = [];
  constructor(context: ActionResolutionStepContext) {
    const { actionUser } = context.actionUserContext;
    const gameUpdateCommand: ActivatedTriggersGameUpdateCommand = {
      type: GameUpdateCommandType.ActivatedTriggers,
      actionUserName: actionUser.getName(),
      actionUserId: actionUser.getEntityId(),
      actionName: context.tracker.actionExecutionIntent.actionName,
      step: stepType,
      completionOrderId: null,
    };
    super(stepType, context, gameUpdateCommand);
    const { tracker, actionUserContext } = this.context;
    const { actionExecutionIntent } = tracker;
    const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];
    const { game, party } = actionUserContext;
    const battleOption = party.getBattleOption(game);
    const { outcomeFlags } = tracker.hitOutcomes;

    const customTriggers = action.hitOutcomeProperties.getHitOutcomeTriggers(context);
    Object.assign(gameUpdateCommand, customTriggers);

    // @REFACTOR - split into smaller functions and make the step just orchestrate
    // maybe use flag -> handler lookup table

    const hpChanges = handleTriggeredLifesteals(this.context, gameUpdateCommand);

    // HANDLE HIT OUTCOME FLAGS

    const durabilityChanges = new DurabilityChangesByEntityId();

    for (const flag of iterateNumericEnum(HitOutcome)) {
      for (const combatantId of outcomeFlags[flag] || []) {
        const targetCombatant = party.combatantManager.getExpectedCombatant(combatantId);

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
          context.rngPolicy.combatDurabilityTarget,
          hpChangeIsCrit
        );

        if (flag === HitOutcome.Hit) {
          const branchingActionsFromHit = handleHit(context, targetCombatant, gameUpdateCommand);
          this.branchingActions.push(...branchingActionsFromHit);
        }

        if (flag === HitOutcome.Death) {
          const { conditionManager } = targetCombatant.combatantProperties;
          for (const condition of conditionManager.getConditions()) {
            if (!condition.removedOnDeath) continue;
            conditionManager.removeConditionById(condition.id);

            const onRemovedTriggeredActions = condition.onRemoved(actionUserContext.party);

            this.branchingActions.push(...onRemovedTriggeredActions);

            const shouldRemoveCombatantOnDeath =
              targetCombatant.combatantProperties.removeFromPartyOnDeath;

            if (!shouldRemoveCombatantOnDeath) {
              console.log(
                "adding removed condition to update for combatant:",
                targetCombatant.getName(),
                "condition:",
                condition.getStringName()
              );
              addRemovedConditionIdToUpdate(
                condition.id,
                gameUpdateCommand,
                targetCombatant.entityProperties.id as CombatantId
              );
            }
          }

          // if was attached to anyone, remove their id from that list
          for (const [_, combatant] of party.combatantManager.getAllCombatants()) {
            if (
              combatant.combatantProperties.transformProperties.attachedCombatants.has(
                targetCombatant.getEntityId()
              )
            ) {
              combatant.combatantProperties.transformProperties.removeAttachedCombatant(
                targetCombatant.getEntityId()
              );
            }
          }

          // kill anyone attached to us that should be
          const attachedCombatantsDeathActionIntents = getKillAttachedCombatantsActionIntents(
            targetCombatant,
            party
          );
          this.branchingActions.push(...attachedCombatantsDeathActionIntents);

          // remove linked conditions such as when a web dies it must remove the ensnared condition
          // from corresponding target
          const { onDeathProperties } = targetCombatant.combatantProperties;
          const shouldRemoveAllConditionsAppliedBy = onDeathProperties?.removeConditionsApplied;

          if (shouldRemoveAllConditionsAppliedBy) {
            const { triggeredActions, conditionIdsRemoved } =
              party.removeConditionsAppliedByCombatant(targetCombatant.getEntityId());
            this.branchingActions.push(...triggeredActions);
            for (const { conditionId, fromCombatantId } of conditionIdsRemoved) {
              addRemovedConditionIdToUpdate(conditionId, gameUpdateCommand, fromCombatantId);
            }
          }

          // @TODO
          // kill attached combatants that die when their attachedTo is killed

          battleOption?.turnOrderManager.updateTrackers(game, party);

          let { threatChanges } = gameUpdateCommand;
          if (threatChanges === undefined) threatChanges = new ThreatChanges();

          for (const monster of party.combatantManager.getDungeonControlledCombatants()) {
            const { threatManager } = monster.combatantProperties;
            if (!threatManager) continue;
            threatChanges.addEntryToRemove(monster.getEntityId(), targetCombatant.getEntityId());
          }

          if (
            gameUpdateCommand.threatChanges === undefined &&
            Object.values(threatChanges.getEntriesToRemove()).length !== 0
          ) {
            gameUpdateCommand.threatChanges = threatChanges;
          }
        }

        if (flag === HitOutcome.Counterattack) {
          // We set their target because of how auto targeting works by checking their selected target
          // but it would be nicer if we could force a certain targetId from the actionExecutionIntent
          // since maybe there would be a bunch of counterattacks queued up. For now though, there isn't.
          targetCombatant.combatantProperties.targetingProperties.setSelectedTarget({
            type: CombatActionTargetType.Single,
            targetId: actionUser.getEntityId(),
          });
          targetCombatant.combatantProperties.targetingProperties.setSelectedActionAndRank(
            new ActionAndRank(CombatActionName.Counterattack, 1 as ActionRank)
          );

          this.branchingActions.push({
            user: targetCombatant,
            actionExecutionIntent: new CombatActionExecutionIntent(
              CombatActionName.Counterattack,
              1 as ActionRank,
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

    // CUSTOM TRIGGER HANDLERS
    // do this after other triggers because these custom triggers
    // might remove a combatant, such as with tame pet

    const { petsTamed } = customTriggers;

    if (petsTamed) {
      for (const { petId, tamerId } of petsTamed) {
        const petCombatant = party.combatantManager.getExpectedCombatant(petId);

        const attachedCombatantsDeathActionIntents = getKillAttachedCombatantsActionIntents(
          petCombatant,
          party
        );
        this.branchingActions.push(...attachedCombatantsDeathActionIntents);

        party.petManager.handlePetTamed(petId, tamerId, game);
        // kill any webs that were on the pet
      }
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

function getKillAttachedCombatantsActionIntents(
  targetCombatant: Combatant,
  party: AdventuringParty
) {
  const intents: ActionIntentAndUser[] = [];
  for (const attachedId of targetCombatant.combatantProperties.transformProperties
    .attachedCombatants) {
    const attachedCombatant = party.combatantManager.getExpectedCombatant(attachedId);
    if (attachedCombatant.combatantProperties.shouldDieWhenCombatantAttachedToDies) {
      intents.push({
        user: attachedCombatant,
        actionExecutionIntent: new CombatActionExecutionIntent(
          CombatActionName.Death,
          1 as ActionRank,
          {
            type: CombatActionTargetType.Single,
            targetId: attachedCombatant.getEntityId(),
          }
        ),
      });
    }
  }

  return intents;
}
