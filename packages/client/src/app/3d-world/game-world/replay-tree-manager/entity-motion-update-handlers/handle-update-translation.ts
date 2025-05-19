import { Vector3 } from "@babylonjs/core";
import {
  ActionEntityMotionGameUpdateCommand,
  CombatantMotionGameUpdateCommand,
  ERROR_MESSAGES,
  EntityTranslation,
} from "@speed-dungeon/common";
import { plainToInstance } from "class-transformer";
import { EntityMotionUpdateCompletionTracker } from "./entity-motion-update-completion-tracker";
import { ModelMovementManager } from "@/app/3d-world/scene-entities/model-movement-manager";
import { BONE_NAMES } from "@/app/3d-world/scene-entities/character-models/skeleton-structure-variables";
import { gameWorld } from "@/app/3d-world/SceneManager";

export function handleUpdateTranslation(
  movementManager: ModelMovementManager,
  translationOption: EntityTranslation | undefined,
  cosmeticDestinationYOption: AbstractEntityPart | undefined,
  updateCompletionTracker: EntityMotionUpdateCompletionTracker,
  gameUpdate: {
    command: CombatantMotionGameUpdateCommand | ActionEntityMotionGameUpdateCommand;
    isComplete: boolean;
  },
  onComplete: () => void
) {
  if (!translationOption) return;

  const destination = plainToInstance(Vector3, translationOption.destination);

  // don't consider the y from the server since the server only calculates 2d positions
  // @TODO - somehow get the real y position from an instructed abstract y position
  if (cosmeticDestinationYOption) {
    const { entityId, referencePoint } = cosmeticDestinationYOption;
    const modelOption = gameWorld.current?.modelManager.combatantModels[entityId];
    if (!modelOption) throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
    if (referencePoint === EntityReferencePoint.CombatantHitboxCenter)
      destination.y = modelOption.getBoundingInfo().boundingBox.center.y;
    else {
      const boneName = BONE_NAMES[ABSTRACT_PARENT_TYPE_TO_BONE_NAME[referencePoint]];
    }
  }

  movementManager.startTranslating(destination, translationOption.duration, () => {
    updateCompletionTracker.setTranslationComplete();

    if (updateCompletionTracker.isComplete()) {
      gameUpdate.isComplete = true;
      onComplete();
    }
  });
}
