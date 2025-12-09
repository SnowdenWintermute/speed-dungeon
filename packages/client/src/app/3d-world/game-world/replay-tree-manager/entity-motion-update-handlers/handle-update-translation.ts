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
import { CharacterModel } from "@/app/3d-world/scene-entities/character-models";

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
  const pathCurveOption = translation.translationPathCurveOption;
  const speedCurveOption = translation.translationSpeedCurveOption;

  if (cosmeticDestinationYOption) {
    const transformNode = SceneEntity.getChildTransformNodeFromIdentifier(
      cosmeticDestinationYOption
    );
    destination.y = transformNode.getAbsolutePosition().y;
  }

  movementManager.startTranslating(
    destination,
    translation.duration,
    { pathCurveOption, speedCurveOption },
    () => {
      updateCompletionTracker.setTranslationComplete();

      if (updateCompletionTracker.isComplete()) {
        gameUpdate.setAsQueuedToComplete();

        if (motionUpdate.translationOption?.setAsNewHome) {
          if (toUpdate instanceof CharacterModel) {
            toUpdate
              .getCombatant()
              .getCombatantProperties()
              .transformProperties.setHomePosition(destination);
          }
        }
        onComplete();
      }
    }
  );
}
