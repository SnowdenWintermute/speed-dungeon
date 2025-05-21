import { Vector3 } from "@babylonjs/core";
import {
  ActionEntityMotionGameUpdateCommand,
  CombatantMotionGameUpdateCommand,
  EntityTranslation,
  SceneEntityChildTransformNodeIdentifier,
} from "@speed-dungeon/common";
import { plainToInstance } from "class-transformer";
import { EntityMotionUpdateCompletionTracker } from "./entity-motion-update-completion-tracker";
import { ModelMovementManager } from "@/app/3d-world/scene-entities/model-movement-manager";
import { SceneEntity } from "@/app/3d-world/scene-entities";

export function handleUpdateTranslation(
  movementManager: ModelMovementManager,
  translationOption: EntityTranslation | undefined,
  cosmeticDestinationYOption: SceneEntityChildTransformNodeIdentifier | undefined,
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
  if (cosmeticDestinationYOption) {
    const transformNode = SceneEntity.getChildTransformNodeFromIdentifier(
      cosmeticDestinationYOption
    );
    destination.y = transformNode.getAbsolutePosition().y;
  }

  movementManager.startTranslating(destination, translationOption.duration, () => {
    updateCompletionTracker.setTranslationComplete();

    if (updateCompletionTracker.isComplete()) {
      gameUpdate.isComplete = true;
      onComplete();
    }
  });
}
