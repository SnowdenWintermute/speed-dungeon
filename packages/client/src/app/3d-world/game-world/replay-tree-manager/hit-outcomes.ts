import {
  AnimationName,
  ERROR_MESSAGES,
  HitOutcome,
  HitOutcomesGameUpdateCommand,
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

export function hitOutcomesGameUpdateHandler(update: {
  command: HitOutcomesGameUpdateCommand;
  isComplete: boolean;
}) {
  const { command } = update;
  const { outcomes, actionUserId } = command;
  const { hitPointChanges, outcomeFlags } = outcomes;
  if (!gameWorld.current) throw new Error(ERROR_MESSAGES.GAME_WORLD.NOT_FOUND);
  if (hitPointChanges) {
    for (const [entityId, hpChange] of Object.entries(hitPointChanges)) {
      const wasBlocked = !!outcomeFlags[HitOutcome.ShieldBlock]?.includes(entityId);
      const wasSpell = false;
      induceHitRecovery(gameWorld.current, actionUserId, entityId, hpChange, wasSpell, wasBlocked);
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
      const actionUserResult = gameState.getCombatant(actionUserId);
      if (actionUserResult instanceof Error) return actionUserResult;
      const targetCombatantResult = gameState.getCombatant(entityId);
      if (targetCombatantResult instanceof Error) return targetCombatantResult;

      const style = CombatLogMessageStyle.Basic;
      let messageText = `${actionUserResult.entityProperties.name} failed to hit ${targetCombatantResult.entityProperties.name}`;

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
    if (targetModel === undefined)
      return console.error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);

    targetModel.animationManager.startAnimationWithTransition(AnimationName.Evade, 0, {
      shouldLoop: false,
      animationDurationOverrideOption: null,
      animationEventOption: null,
      onComplete: () => {},
    });

    useGameStore.getState().mutateState((gameState) => {
      const actionUserResult = gameState.getCombatant(actionUserId);
      if (actionUserResult instanceof Error) return actionUserResult;
      const targetCombatantResult = gameState.getCombatant(entityId);
      if (targetCombatantResult instanceof Error) return targetCombatantResult;

      const style = CombatLogMessageStyle.Basic;
      let messageText = `${targetCombatantResult.entityProperties.name} evaded an attack from ${actionUserResult.entityProperties.name}`;

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
      return console.error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);

    targetModel.animationManager.startAnimationWithTransition(AnimationName.Parry, 0, {
      shouldLoop: false,
      animationDurationOverrideOption: null,
      animationEventOption: null,
      onComplete: () => {},
    });

    useGameStore.getState().mutateState((gameState) => {
      const actionUserResult = gameState.getCombatant(actionUserId);
      if (actionUserResult instanceof Error) return actionUserResult;
      const targetCombatantResult = gameState.getCombatant(entityId);
      if (targetCombatantResult instanceof Error) return targetCombatantResult;

      const style = CombatLogMessageStyle.Basic;
      let messageText = `${targetCombatantResult.entityProperties.name} parried an attack from ${actionUserResult.entityProperties.name}`;

      gameState.combatLogMessages.push(new CombatLogMessage(messageText, style));
    });
  });
}
