import { Vector3 } from "@babylonjs/core";
import {
  ActionEntityMotionGameUpdateCommand,
  CombatantMotionGameUpdateCommand,
  EntityMotionUpdate,
  EntityTranslation,
  SceneEntityChildTransformNodeIdentifier,
} from "@speed-dungeon/common";
import { plainToInstance } from "class-transformer";
import { EntityMotionUpdateCompletionTracker } from "./entity-motion-update-completion-tracker";
import { SceneEntity } from "@/app/3d-world/scene-entities";
import { getSceneEntityToUpdate } from "./get-scene-entity-to-update";
import { GameUpdateTracker } from "../game-update-tracker";

export function handleUpdateTranslation(
  motionUpdate: EntityMotionUpdate,
  translation: EntityTranslation,
  cosmeticDestinationYOption: SceneEntityChildTransformNodeIdentifier | undefined,
  updateCompletionTracker: EntityMotionUpdateCompletionTracker,
  gameUpdate: GameUpdateTracker<
    CombatantMotionGameUpdateCommand | ActionEntityMotionGameUpdateCommand
  >,
  onComplete: () => void
) {
  const toUpdate = getSceneEntityToUpdate(motionUpdate);
  const { movementManager, skeletalAnimationManager, dynamicAnimationManager } = toUpdate;
  const destination = plainToInstance(Vector3, translation.destination);

  // don't consider the y from the server since the server only calculates 2d positions
  if (cosmeticDestinationYOption) {
    const transformNode = SceneEntity.getChildTransformNodeFromIdentifier(
      cosmeticDestinationYOption
    );
    destination.y = transformNode.getAbsolutePosition().y;
  }

  movementManager.startTranslating(destination, translation.duration, () => {
    updateCompletionTracker.setTranslationComplete();

    if (updateCompletionTracker.isComplete()) {
      gameUpdate.setAsQueuedToComplete();
      onComplete();
    }
  });
}
