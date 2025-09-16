import {
  SkeletalAnimationName,
  HitOutcome,
  HitOutcomesGameUpdateCommand,
  ActionPayableResource,
  COMBAT_ACTIONS,
  ManaChanges,
} from "@speed-dungeon/common";
import { getGameWorld } from "../../SceneManager";
import { useGameStore } from "@/stores/game-store";
import { CombatLogMessage, CombatLogMessageStyle } from "@/app/game/combat-log/combat-log-message";
import {
  FLOATING_TEXT_COLORS,
  FloatingMessageElement,
  FloatingMessageElementType,
  FloatingMessageTextColor,
  startFloatingMessage,
} from "@/stores/game-store/floating-messages";
import { plainToInstance } from "class-transformer";
import { HitPointChanges } from "@speed-dungeon/common";
import { induceHitRecovery } from "./induce-hit-recovery";
import { handleThreatChangesUpdate } from "./handle-threat-changes";
import { CombatActionResource } from "@speed-dungeon/common";

export async function hitOutcomesGameUpdateHandler(update: {
  command: HitOutcomesGameUpdateCommand;
  isComplete: boolean;
}) {
  update.isComplete = true;
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
    const elements: FloatingMessageElement[] = [
      {
        type: FloatingMessageElementType.Text,
        text: `Miss`,
        classNames: { mainText: "text-gray-500", shadowText: "text-black" },
      },
    ];

    startFloatingMessage(entityId, elements, 2000);

    useGameStore.getState().mutateState((gameState) => {
      const targetCombatantResult = gameState.getCombatant(entityId);
      if (targetCombatantResult instanceof Error) throw targetCombatantResult;

      const style = CombatLogMessageStyle.Basic;
      let messageText = `${actionUserName} failed to hit ${targetCombatantResult.entityProperties.name}`;

      gameState.combatLogMessages.push(new CombatLogMessage(messageText, style));
    });
  });

  outcomeFlags[HitOutcome.Evade]?.forEach((entityId) => {
    const elements: FloatingMessageElement[] = [
      {
        type: FloatingMessageElementType.Text,
        text: `Evade`,
        classNames: { mainText: "text-gray-500", shadowText: "text-black" },
      },
    ];

    startFloatingMessage(entityId, elements, 2000);

    const targetModel = getGameWorld().modelManager.findOne(entityId);

    targetModel.skeletalAnimationManager.startAnimationWithTransition(
      SkeletalAnimationName.Evade,
      0,
      {
        onComplete: () => targetModel.startIdleAnimation(100),
      }
    );

    useGameStore.getState().mutateState((gameState) => {
      const targetCombatantResult = gameState.getCombatant(entityId);
      if (targetCombatantResult instanceof Error) throw targetCombatantResult;

      const style = CombatLogMessageStyle.Basic;
      let messageText = `${targetCombatantResult.entityProperties.name} evaded an attack from ${actionUserName}`;

      gameState.combatLogMessages.push(new CombatLogMessage(messageText, style));
    });
  });

  outcomeFlags[HitOutcome.Parry]?.forEach((entityId) => {
    const elements: FloatingMessageElement[] = [
      {
        type: FloatingMessageElementType.Text,
        text: `Parry`,
        classNames: {
          mainText: FLOATING_TEXT_COLORS[FloatingMessageTextColor.Parried],
          shadowText: "text-black",
        },
      },
    ];

    startFloatingMessage(entityId, elements, 2000);

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

    useGameStore.getState().mutateState((gameState) => {
      const targetCombatantResult = gameState.getCombatant(entityId);
      if (targetCombatantResult instanceof Error) throw targetCombatantResult;

      const style = CombatLogMessageStyle.Basic;
      let messageText = `${targetCombatantResult.entityProperties.name} parried an attack from ${actionUserName}`;

      gameState.combatLogMessages.push(new CombatLogMessage(messageText, style));
    });
  });

  outcomeFlags[HitOutcome.Counterattack]?.forEach((entityId) => {
    const elements: FloatingMessageElement[] = [
      {
        type: FloatingMessageElementType.Text,
        text: `Countered`,
        classNames: {
          mainText: FLOATING_TEXT_COLORS[FloatingMessageTextColor.Parried],
          shadowText: "text-black",
        },
      },
    ];

    startFloatingMessage(entityId, elements, 2000);

    useGameStore.getState().mutateState((gameState) => {
      const targetCombatantResult = gameState.getCombatant(entityId);
      if (targetCombatantResult instanceof Error) throw targetCombatantResult;

      const style = CombatLogMessageStyle.Basic;
      let messageText = `${targetCombatantResult.entityProperties.name} countered an attack from ${actionUserName}`;

      gameState.combatLogMessages.push(new CombatLogMessage(messageText, style));
    });
  });
}
