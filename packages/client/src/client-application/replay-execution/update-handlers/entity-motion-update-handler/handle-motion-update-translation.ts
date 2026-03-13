import { Vector3 } from "@babylonjs/core";
import {
  ActionEntityMotionGameUpdateCommand,
  CombatantMotionGameUpdateCommand,
  EntityMotionUpdate,
  EntityTranslation,
  SceneEntityChildTransformNodeIdentifier,
} from "@speed-dungeon/common";
import { plainToInstance } from "class-transformer";
import { getSceneEntityToUpdate } from "./get-scene-entity-to-update";
import { CharacterModel } from "@/game-world-view/scene-entities/character-models";
import { SceneEntity } from "@/game-world-view/scene-entities";
import { ReplayGameUpdateTracker } from "../../replay-game-update-completion-tracker";
import { EntityMotionUpdateCompletionTracker } from "./entity-motion-completion-tracker";
import { GameWorldView } from "@/game-world-view";

export function handleMotionUpdateTranslation(
  motionUpdate: EntityMotionUpdate,
  translation: EntityTranslation,
  cosmeticDestinationYOption: SceneEntityChildTransformNodeIdentifier | undefined,
  updateCompletionTracker: EntityMotionUpdateCompletionTracker,
  gameUpdate: ReplayGameUpdateTracker<
    CombatantMotionGameUpdateCommand | ActionEntityMotionGameUpdateCommand
  >,
  onComplete: () => void,
  gameWorldView: GameWorldView
) {
  const toUpdate = getSceneEntityToUpdate(gameWorldView, motionUpdate);
  const { movementManager, skeletalAnimationManager, dynamicAnimationManager } = toUpdate;
  const destination = plainToInstance(Vector3, translation.destination);

  // don't consider the y from the server since the server only calculates 2d positions
  if (cosmeticDestinationYOption) {
    const transformNode = SceneEntity.getChildTransformNodeFromIdentifier(
      cosmeticDestinationYOption,
      gameWorldView
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
