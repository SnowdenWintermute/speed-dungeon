import {
  SkeletalAnimationName,
  HitOutcome,
  HitOutcomesGameUpdateCommand,
  ActionPayableResource,
  COMBAT_ACTIONS,
  ManaChanges,
} from "@speed-dungeon/common";
import { getGameWorld } from "../../SceneManager";
import { plainToInstance } from "class-transformer";
import { HitPointChanges } from "@speed-dungeon/common";
import { induceHitRecovery } from "./induce-hit-recovery";
import { handleThreatChangesUpdate } from "./handle-threat-changes";
import { CombatActionResource } from "@speed-dungeon/common";
import { GameUpdateTracker } from "./game-update-tracker";
import { FloatingMessageService } from "@/mobx-stores/game-event-notifications/floating-message-service";
import { GameLogMessageService } from "@/mobx-stores/game-event-notifications/game-log-message-service";
import { AppStore } from "@/mobx-stores/app-store";

export async function hitOutcomesGameUpdateHandler(
  update: GameUpdateTracker<HitOutcomesGameUpdateCommand>
) {
  const { command } = update;
  const { outcomes, actionUserName, actionUserId } = command;
  const { outcomeFlags } = outcomes;
  let hitPointChanges: HitPointChanges | null = null;
  if (outcomes.resourceChanges && outcomes.resourceChanges[CombatActionResource.HitPoints])
    hitPointChanges = plainToInstance(
      HitPointChanges,
      outcomes.resourceChanges[CombatActionResource.HitPoints]
    );

  let manaChanges: ManaChanges | null = null;

  if (outcomes.resourceChanges && outcomes.resourceChanges[CombatActionResource.Mana])
    manaChanges = plainToInstance(ManaChanges, outcomes.resourceChanges[CombatActionResource.Mana]);

  const entitiesAlreadyAnimatingHitRecovery: string[] = [];

  const action = COMBAT_ACTIONS[command.actionName];

  if (hitPointChanges) {
    for (const [entityId, hpChange] of hitPointChanges.getRecords()) {
      const wasBlocked = !!outcomeFlags[HitOutcome.ShieldBlock]?.includes(entityId);
      induceHitRecovery(
        actionUserName,
        actionUserId,
        command.actionName,
        command.step,
        hpChange,
        ActionPayableResource.HitPoints,
        entityId,
        wasBlocked,
        action.hitOutcomeProperties.getShouldAnimateTargetHitRecovery()
      );

      entitiesAlreadyAnimatingHitRecovery.push(entityId);
    }
  }

  if (manaChanges) {
    for (const [entityId, change] of manaChanges.getRecords()) {
      const wasBlocked = !!outcomeFlags[HitOutcome.ShieldBlock]?.includes(entityId);
      induceHitRecovery(
        actionUserName,
        actionUserId,
        command.actionName,
        command.step,
        change,
        ActionPayableResource.Mana,
        entityId,
        wasBlocked,
        action.hitOutcomeProperties.getShouldAnimateTargetHitRecovery() &&
          !entitiesAlreadyAnimatingHitRecovery.includes(entityId)
      );
    }
  }

  handleThreatChangesUpdate(command);

  outcomeFlags[HitOutcome.Miss]?.forEach((entityId) => {
    FloatingMessageService.startHitOutcomeMissMessage(entityId);

    const targetCombatantResult = AppStore.get().gameStore.getExpectedCombatant(entityId);
    GameLogMessageService.postActionMissed(actionUserName, targetCombatantResult.getName());
  });

  outcomeFlags[HitOutcome.Evade]?.forEach((entityId) => {
    FloatingMessageService.startHitOutcomeEvadeMessage(entityId);

    const targetCombatantResult = AppStore.get().gameStore.getExpectedCombatant(entityId);
    GameLogMessageService.postActionEvaded(actionUserName, targetCombatantResult.getName());

    const targetModel = getGameWorld().modelManager.findOne(entityId);

    targetModel.skeletalAnimationManager.startAnimationWithTransition(
      SkeletalAnimationName.Evade,
      0,
      {
        onComplete: () => targetModel.startIdleAnimation(100),
      }
    );
  });

  outcomeFlags[HitOutcome.Parry]?.forEach((entityId) => {
    FloatingMessageService.startHitOutcomeParryMessage(entityId);

    const targetModel = getGameWorld().modelManager.findOne(entityId);

    targetModel.skeletalAnimationManager.startAnimationWithTransition(
      SkeletalAnimationName.Parry,
      0,
      {
        animationDurationOverrideOption: 500,
        onComplete: () => {
          targetModel.startIdleAnimation(500);
        },
      }
    );

    const targetCombatantResult = AppStore.get().gameStore.getExpectedCombatant(entityId);
    GameLogMessageService.postActionParried(actionUserName, targetCombatantResult.getName());
  });

  outcomeFlags[HitOutcome.Counterattack]?.forEach((entityId) => {
    FloatingMessageService.startHitOutcomeCounteredMessage(entityId);

    const targetCombatantResult = AppStore.get().gameStore.getExpectedCombatant(entityId);
    GameLogMessageService.postActionCountered(actionUserName, targetCombatantResult.getName());
  });

  outcomeFlags[HitOutcome.Resist]?.forEach((entityId) => {
    FloatingMessageService.startHitOutcomeResistedMessage(entityId);

    const targetCombatantResult = AppStore.get().gameStore.getExpectedCombatant(entityId);
    GameLogMessageService.postActionResisted(actionUserName, targetCombatantResult.getName());
  });

  update.setAsQueuedToComplete();
}
