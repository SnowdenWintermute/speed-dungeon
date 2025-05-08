import { ERROR_MESSAGES, CombatantMotionGameUpdateCommand } from "@speed-dungeon/common";
import { gameWorld } from "../../../SceneManager";
import { handleEntityMotionUpdate } from "./handle-entity-motion-update";

export function combatantMotionGameUpdateHandler(update: {
  command: CombatantMotionGameUpdateCommand;
  isComplete: boolean;
}) {
  const { command } = update;
  const { mainEntityUpdate } = command;

  const onTranslationComplete = () => {
    if (mainEntityUpdate.idleOnComplete) {
      const combatantModelOption =
        gameWorld.current?.modelManager.combatantModels[mainEntityUpdate.entityId];
      if (!combatantModelOption) throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
      combatantModelOption.startIdleAnimation(500);
    }
  };

  const onAnimationComplete = () => {
    if (mainEntityUpdate.idleOnComplete) {
      const combatantModelOption =
        gameWorld.current?.modelManager.combatantModels[mainEntityUpdate.entityId];
      if (!combatantModelOption) throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
      combatantModelOption.startIdleAnimation(500);
    }
  };

  handleEntityMotionUpdate(
    update,
    command.mainEntityUpdate,
    onTranslationComplete,
    onAnimationComplete
  );
}
