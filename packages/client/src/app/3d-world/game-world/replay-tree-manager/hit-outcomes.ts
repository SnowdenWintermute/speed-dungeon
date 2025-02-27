import {
  AnimationName,
  ERROR_MESSAGES,
  HitOutcomesGameUpdateCommand,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { induceHitRecovery } from "../../combatant-models/animation-manager/induce-hit-recovery";
import { gameWorld } from "../../SceneManager";
import { useGameStore } from "@/stores/game-store";
import startHpChangeFloatingMessage from "../../combatant-models/animation-manager/start-hp-change-floating-message";
import { CombatLogMessage, CombatLogMessageStyle } from "@/app/game/combat-log/combat-log-message";
import {
  FloatingMessageElement,
  FloatingMessageElementType,
  FloatingMessageTextColor,
  getTailwindClassFromFloatingTextColor,
  startFloatingMessage,
} from "@/stores/game-store/floating-messages";

export function hitOutcomesGameUpdateHandler(update: {
  command: HitOutcomesGameUpdateCommand;
  isComplete: boolean;
}) {
  console.log("GOT HIT OUTCOMES: ", update.command);
  const { command } = update;
  const { outcomes, actionUserId } = command;
  const { hitPointChanges, misses, evades, parries, counters } = outcomes;
  if (!gameWorld.current) throw new Error(ERROR_MESSAGES.GAME_WORLD.NOT_FOUND);
  if (hitPointChanges) {
    for (const [entityId, hpChange] of Object.entries(hitPointChanges))
      induceHitRecovery(gameWorld.current, actionUserId, entityId, hpChange, false);
  }

  misses?.forEach((entityId) => {
    const targetModel = gameWorld.current?.modelManager.combatantModels[entityId];
    if (targetModel === undefined)
      return console.error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);

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

      // targetModel.animationManager.startAnimationWithTransition(AnimationName.Evade, 0, {
      //   shouldLoop: false,
      //   animationDurationOverrideOption: null,
      //   animationEventOption: null,
      //   onComplete: () => {},
      // });
    });
  });
}
