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
import { getSceneEntityToUpdate } from "./get-scene-entity-to-update";
import { GameUpdateTracker } from "../game-update-tracker";
import { CharacterModel } from "@/game-world-view/scene-entities/character-models";
import { SceneEntity } from "@/game-world-view/scene-entities";
import { getGameWorldView } from "@/app/game-world-view-canvas/SceneManager";

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
      cosmeticDestinationYOption,
      getGameWorldView()
    );
    destination.y = transformNode.getAbsolutePosition().y;
  }

  const pathCurveOption = translation.translationPathCurveOption;
  const speedCurveOption = translation.translationSpeedCurveOption;

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
