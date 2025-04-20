import {
  SkeletalAnimationName,
  ERROR_MESSAGES,
  HitOutcome,
  HitOutcomesGameUpdateCommand,
  ActionPayableResource,
} from "@speed-dungeon/common";
import { induceHitRecovery } from "../../combatant-models/animation-manager/induce-hit-recovery";
import { gameWorld } from "../../SceneManager";
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

export function hitOutcomesGameUpdateHandler(update: {
  command: HitOutcomesGameUpdateCommand;
  isComplete: boolean;
}) {
  const { command } = update;
  const { outcomes, actionUserName, actionUserId } = command;
  console.log("action user name: ", actionUserName, "action user id: ", actionUserId);
  const { outcomeFlags } = outcomes;
  const hitPointChanges = plainToInstance(HitPointChanges, outcomes.hitPointChanges);
  const manaChanges = plainToInstance(HitPointChanges, outcomes.manaChanges);

  if (!gameWorld.current) throw new Error(ERROR_MESSAGES.GAME_WORLD.NOT_FOUND);

  const entitiesAlreadyAnimatingHitRecovery: string[] = [];

  if (hitPointChanges) {
    for (const [entityId, hpChange] of hitPointChanges.getRecords()) {
      const wasBlocked = !!outcomeFlags[HitOutcome.ShieldBlock]?.includes(entityId);
      induceHitRecovery(
        gameWorld.current,
        actionUserName,
        actionUserId,
        command.actionName,
        command.step,
        hpChange,
        ActionPayableResource.HitPoints,
        entityId,
        wasBlocked,
        true
      );

      entitiesAlreadyAnimatingHitRecovery.push(entityId);
    }
  }

  if (manaChanges) {
    for (const [entityId, change] of manaChanges.getRecords()) {
      const wasBlocked = !!outcomeFlags[HitOutcome.ShieldBlock]?.includes(entityId);
      const wasSpell = false;
      induceHitRecovery(
        gameWorld.current,
        actionUserName,
        actionUserId,
        change,
        ActionPayableResource.Mana,
        entityId,
        wasSpell,
        wasBlocked,
        !entitiesAlreadyAnimatingHitRecovery.includes(entityId)
      );
    }
  }

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

    const targetModel = gameWorld.current?.modelManager.combatantModels[entityId];
    if (targetModel === undefined) throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);

    targetModel.animationManager.startAnimationWithTransition(SkeletalAnimationName.Evade, 0, {});

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

    const targetModel = gameWorld.current?.modelManager.combatantModels[entityId];
    if (targetModel === undefined)
      throw console.error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);

    targetModel.animationManager.startAnimationWithTransition(SkeletalAnimationName.Parry, 0, {
      animationDurationOverrideOption: 500,
      onComplete: () => {
        targetModel.startIdleAnimation(500);
      },
    });

    useGameStore.getState().mutateState((gameState) => {
      const targetCombatantResult = gameState.getCombatant(entityId);
      if (targetCombatantResult instanceof Error) throw targetCombatantResult;

      const style = CombatLogMessageStyle.Basic;
      let messageText = `${targetCombatantResult.entityProperties.name} parried an attack from ${actionUserName}`;

      gameState.combatLogMessages.push(new CombatLogMessage(messageText, style));
    });
  });
}
