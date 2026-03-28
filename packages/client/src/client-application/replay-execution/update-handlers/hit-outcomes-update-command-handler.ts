import {
  SkeletalAnimationName,
  HitOutcome,
  HitOutcomesGameUpdateCommand,
  ActionPayableResource,
  COMBAT_ACTIONS,
  ManaChanges,
  HitPointChanges,
  CombatActionResource,
} from "@speed-dungeon/common";
import { plainToInstance } from "class-transformer";
import { ReplayGameUpdateTracker } from "../replay-game-update-completion-tracker";
import { ClientApplication } from "@/client-application";
import { CombatantResourceChangeUpdateHandlerCommand } from "./resource-change-update-handler-command";
import { handleThreatChangesUpdate } from "./activated-triggers-update-handler/threat-changes";

export async function hitOutcomesGameUpdateHandler(
  clientApplication: ClientApplication,
  update: ReplayGameUpdateTracker<HitOutcomesGameUpdateCommand>
) {
  const { command } = update;
  const { outcomes, actionUserName } = command;
  const { outcomeFlags } = outcomes;
  let hitPointChanges: HitPointChanges | null = null;
  if (outcomes.resourceChanges && outcomes.resourceChanges[CombatActionResource.HitPoints]) {
    hitPointChanges = HitPointChanges.fromSerialized(
      outcomes.resourceChanges[CombatActionResource.HitPoints]
    );
  }

  let manaChanges: ManaChanges | null = null;

  if (outcomes.resourceChanges && outcomes.resourceChanges[CombatActionResource.Mana]) {
    manaChanges = plainToInstance(ManaChanges, outcomes.resourceChanges[CombatActionResource.Mana]);
  }

  const entitiesAlreadyAnimatingHitRecovery: string[] = [];

  const action = COMBAT_ACTIONS[command.actionName];

  if (hitPointChanges) {
    for (const [entityId, hpChange] of hitPointChanges.getRecords()) {
      const wasBlocked = !!outcomeFlags[HitOutcome.ShieldBlock]?.includes(entityId);
      new CombatantResourceChangeUpdateHandlerCommand(
        clientApplication,
        command,
        hpChange,
        ActionPayableResource.HitPoints,
        entityId,
        wasBlocked,
        action.hitOutcomeProperties.getShouldAnimateTargetHitRecovery()
      ).execute();

      entitiesAlreadyAnimatingHitRecovery.push(entityId);
    }
  }

  if (manaChanges) {
    for (const [entityId, change] of manaChanges.getRecords()) {
      const wasBlocked = !!outcomeFlags[HitOutcome.ShieldBlock]?.includes(entityId);
      new CombatantResourceChangeUpdateHandlerCommand(
        clientApplication,
        command,
        change,
        ActionPayableResource.Mana,
        entityId,
        wasBlocked,
        action.hitOutcomeProperties.getShouldAnimateTargetHitRecovery() &&
          !entitiesAlreadyAnimatingHitRecovery.includes(entityId)
      ).execute();
    }
  }

  handleThreatChangesUpdate(clientApplication, command);

  outcomeFlags[HitOutcome.Miss]?.forEach((entityId) => {
    clientApplication.floatingMessagesService.startHitOutcomeMissMessage(entityId);
    const targetCombatantResult = clientApplication.gameContext.requireCombatant(entityId);
    clientApplication.eventLogMessageService.postActionMissed(
      actionUserName,
      targetCombatantResult.getName()
    );
  });

  outcomeFlags[HitOutcome.Evade]?.forEach((entityId) => {
    clientApplication.floatingMessagesService.startHitOutcomeEvadeMessage(entityId);

    const targetCombatantResult = clientApplication.gameContext.requireCombatant(entityId);
    clientApplication.eventLogMessageService.postActionEvaded(
      actionUserName,
      targetCombatantResult.getName()
    );

    const targetModel =
      clientApplication.gameWorldView?.sceneEntityService.combatantSceneEntityManager.requireById(
        entityId
      );

    targetModel?.skeletalAnimationManager.startAnimationWithTransition(
      SkeletalAnimationName.Evade,
      0,
      {
        onComplete: () => targetModel.animationControls.startIdleAnimation(100),
      }
    );
  });

  outcomeFlags[HitOutcome.Parry]?.forEach((entityId) => {
    clientApplication.floatingMessagesService.startHitOutcomeParryMessage(entityId);

    const targetModel =
      clientApplication.gameWorldView?.sceneEntityService.combatantSceneEntityManager.requireById(
        entityId
      );

    targetModel?.skeletalAnimationManager.startAnimationWithTransition(
      SkeletalAnimationName.Parry,
      0,
      {
        animationDurationOverrideOption: 500,
        onComplete: () => {
          targetModel.animationControls.startIdleAnimation(500);
        },
      }
    );

    const targetCombatantResult = clientApplication.gameContext.requireCombatant(entityId);
    clientApplication.eventLogMessageService.postActionParried(
      actionUserName,
      targetCombatantResult.getName()
    );
  });

  outcomeFlags[HitOutcome.Counterattack]?.forEach((entityId) => {
    clientApplication.floatingMessagesService.startHitOutcomeCounteredMessage(entityId);

    const targetCombatantResult = clientApplication.gameContext.requireCombatant(entityId);
    clientApplication.eventLogMessageService.postActionCountered(
      actionUserName,
      targetCombatantResult.getName()
    );
  });

  outcomeFlags[HitOutcome.Resist]?.forEach((entityId) => {
    clientApplication.floatingMessagesService.startHitOutcomeResistedMessage(entityId);

    const targetCombatantResult = clientApplication.gameContext.requireCombatant(entityId);
    clientApplication.eventLogMessageService.postActionResisted(
      actionUserName,
      targetCombatantResult.getName()
    );
  });
}
