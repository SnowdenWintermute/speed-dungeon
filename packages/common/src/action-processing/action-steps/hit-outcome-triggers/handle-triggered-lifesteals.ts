import {
  COMBAT_ACTIONS,
  CombatActionHitOutcomes,
  CombatActionResource,
  HitPointChanges,
  ResourceChange,
  ResourceChangeSource,
  ResourceChangeSourceCategory,
} from "../../../combat/index.js";
import { ActivatedTriggersGameUpdateCommand } from "../../game-update-commands.js";
import { ActionResolutionStepContext } from "../index.js";

export function handleTriggeredLifesteals(
  context: ActionResolutionStepContext,
  gameUpdateCommand: ActivatedTriggersGameUpdateCommand
) {
  const { tracker, actionUserContext } = context;
  const { actionExecutionIntent } = tracker;
  const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];
  const { party, actionUser } = actionUserContext;
  const { resourceChanges } = tracker.hitOutcomes;

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

  const triggeredHitPointChanges = new HitPointChanges();

  const idToCreditLifesteal = actionUser.getIdOfEntityToCreditWithThreat();

  // @TODO - change triggered hp changes to an array since the same action might damage the user
  // but also result in a separate lifesteal on the user
  if (accumulatedLifeStolenResourceChange) {
    accumulatedLifeStolenResourceChange.value = Math.floor(
      accumulatedLifeStolenResourceChange.value
    );
    const existingHitPointChangeOption = triggeredHitPointChanges.getRecord(idToCreditLifesteal);
    if (existingHitPointChangeOption)
      existingHitPointChangeOption.value += accumulatedLifeStolenResourceChange.value;
    else
      triggeredHitPointChanges.addRecord(idToCreditLifesteal, accumulatedLifeStolenResourceChange);
  }

  // @TODO - calculate Death flags for these hp changes
  triggeredHitPointChanges.applyToGame(party);

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
      threatChangesOption.applyToGame(party);
      gameUpdateCommand.threatChanges = threatChangesOption;
    }
  }

  return hpChanges;
}
