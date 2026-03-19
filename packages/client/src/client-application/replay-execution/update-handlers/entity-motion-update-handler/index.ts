import {
  ActionEntityMotionUpdate,
  CombatantMotionUpdate,
  EntityMotionUpdateCommand,
  EntityTranslation,
  SceneEntityChildTransformNodeIdentifierWithDuration,
} from "@speed-dungeon/common";
import { ReplayGameUpdateTracker } from "../../replay-game-update-completion-tracker";
import {
  AnimationType,
  CleanupMode,
  EntityId,
  EntityMotionUpdate,
  SpawnableEntityType,
} from "@speed-dungeon/common";
import { getSceneEntityToUpdate } from "./get-scene-entity-to-update";
import { plainToInstance } from "class-transformer";
import { Quaternion, Vector3 } from "@babylonjs/core";
import { DynamicAnimationManager } from "@/game-world-view/scene-entities/model-animation-managers/dynamic-animation-manager";
import { SkeletalAnimationManager } from "@/game-world-view/scene-entities/model-animation-managers/skeletal-animation-manager";
import { handleMotionUpdateTranslation } from "./handle-motion-update-translation";
import { handleMotionUpdateAnimation } from "./handle-motion-update-animation";
import { ClientApplication } from "@/client-application";
import { GameWorldView } from "@/xxNEW-game-world-view";
import { SceneEntity } from "@/xxNEW-game-world-view/scene-entities/base";
import { SceneEntityService } from "@/xxNEW-game-world-view/scene-entity-service/index";
import { CombatantSceneEntity } from "@/xxNEW-game-world-view/scene-entities/combatants";

export class EntityMotionGameUpdateHandlerCommand {
  private gameWorldView: GameWorldView | null;

  constructor(
    private clientApplication: ClientApplication,
    private updateTracker: ReplayGameUpdateTracker<EntityMotionUpdateCommand>
  ) {
    this.gameWorldView = clientApplication.gameWorldView;
  }

  execute() {
    const { mainEntityUpdate, auxiliaryUpdates } = this.updateTracker.command;

    this.processChild(this.updateTracker, mainEntityUpdate);

    if (!auxiliaryUpdates) return;
    for (const auxiliaryUpdate of auxiliaryUpdates) {
      this.processChild(this.updateTracker, auxiliaryUpdate);
    }
  }

  handleTranslation(
    motionUpdate: EntityMotionUpdate,
    translation: EntityTranslation,
    onComplete?: () => void
  ) {
    const { gameWorldView } = this;
    if (!gameWorldView) return;

    const { sceneEntityService } = gameWorldView;
    const sceneEntity = sceneEntityService.getFromMotionUpdate(motionUpdate);
    const { movementManager } = sceneEntity;
    const destination = plainToInstance(Vector3, translation.destination);
    const cosmeticDestinationYOption =
      motionUpdate.entityType === SpawnableEntityType.ActionEntity
        ? motionUpdate.cosmeticDestinationY
        : undefined;

    // don't consider the y from the server since the server only calculates 2d positions
    if (cosmeticDestinationYOption) {
      const transformNode = sceneEntityService.getChildTransformNodeFromIdentifier(
        cosmeticDestinationYOption
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
        if (
          motionUpdate.translationOption?.setAsNewHome &&
          sceneEntity instanceof CombatantSceneEntity
        ) {
          sceneEntity.combatant.combatantProperties.transformProperties.setHomePosition(
            destination
          );
        }
        onComplete?.();
      }
    );
  }

  processChild(
    update: ReplayGameUpdateTracker<EntityMotionUpdateCommand>,
    motionUpdate: EntityMotionUpdate
  ) {
    const { gameWorldView } = this;
    if (!gameWorldView) {
      return;
    }

    const { translationOption, rotationOption, animationOption } = motionUpdate;
    const entityTypeHandler = this.getEntityTypeMotionUpdateHandler(gameWorldView, motionUpdate);
    const completionHandlers = entityTypeHandler();

    if (translationOption) {
      this.handleTranslation(
        motionUpdate,
        translationOption,
        completionHandlers?.onTranslationComplete
      );
    }

    if (rotationOption) {
      const toUpdate = gameWorldView.sceneEntityService.getFromMotionUpdate(motionUpdate);
      toUpdate.movementManager.startRotatingTowards(
        plainToInstance(Quaternion, rotationOption.rotation),
        rotationOption.duration,
        () => {
          /*no-op*/
        }
      );
    }

    if (animationOption) {
      const toUpdate = getSceneEntityToUpdate(gameWorldView, motionUpdate);
      let animationManager: DynamicAnimationManager | SkeletalAnimationManager =
        toUpdate.skeletalAnimationManager;

      if (animationOption.name.type === AnimationType.Dynamic) {
        animationManager = toUpdate.dynamicAnimationManager;
      }

      handleMotionUpdateAnimation(
        animationManager,
        animationOption,
        updateCompletionTracker,
        update,
        onAnimationComplete
      );
    }
  }

  getEntityTypeMotionUpdateHandler(gameWorldView: GameWorldView, motionUpdate: EntityMotionUpdate) {
    switch (motionUpdate.entityType) {
      case SpawnableEntityType.Combatant:
        return () => this.processCombatant(gameWorldView, motionUpdate);
      case SpawnableEntityType.ActionEntity:
        return () => this.processActionEntity(gameWorldView, motionUpdate);
    }
  }

  processActionEntity(gameWorldView: GameWorldView, motionUpdate: ActionEntityMotionUpdate) {
    const { actionEntityManager } = gameWorldView.sceneEntityService;
    const sceneEntity = actionEntityManager.requireById(motionUpdate.entityId);

    if (motionUpdate.setParent !== undefined) {
      this.handleEntityMotionSetNewParentUpdate(
        sceneEntity,
        gameWorldView.sceneEntityService,
        motionUpdate.setParent
      );
    }
    if (motionUpdate.lockRotationToFace !== undefined) {
      sceneEntity.lockRotationToFaceToward(gameWorldView, motionUpdate.lockRotationToFace);
    }
    if (motionUpdate.startPointingToward !== undefined) {
      sceneEntity.startPointingTowardEntity(gameWorldView, motionUpdate.startPointingToward);
    }

    const { translationOption, animationOption, despawnOnCompleteMode, entityId } = motionUpdate;

    if (!translationOption && !animationOption && despawnOnCompleteMode !== undefined) {
      actionEntityManager.unregister(entityId, despawnOnCompleteMode);
    }

    let alreadyDespawned = false;
    const onMotionComplete = () => {
      if (despawnOnCompleteMode === undefined || alreadyDespawned) return;
      actionEntityManager.unregister(entityId, despawnOnCompleteMode);
      alreadyDespawned = true;
    };
    const onTranslationComplete = onMotionComplete;
    const onAnimationComplete = onMotionComplete;

    return { onTranslationComplete, onAnimationComplete };
  }

  processCombatant(gameWorldView: GameWorldView, motionUpdate: CombatantMotionUpdate) {
    const combatant = this.clientApplication.gameContext.requireCombatant(motionUpdate.entityId);
    const { combatantSceneEntityManager } = gameWorldView.sceneEntityService;
    const combatantModelOption = combatantSceneEntityManager.requireById(motionUpdate.entityId);

    if (motionUpdate.setParent !== undefined) {
      this.handleEntityMotionSetNewParentUpdate(
        combatantModelOption,
        gameWorldView.sceneEntityService,
        motionUpdate.setParent
      );
    }

    // they are already dead, so don't animate them
    // this happens if a combatant dies from getting counterattacked and the server
    // tells them to "return home"
    if (combatant.combatantProperties.isDead()) return;

    const onMotionComplete = () => {
      if (!motionUpdate.idleOnComplete) return;
      combatantModelOption.animationControls.startIdleAnimation(500);
    };
    const onTranslationComplete = onMotionComplete;
    const onAnimationComplete = onMotionComplete;

    if (motionUpdate.equipmentAnimations) {
      combatantModelOption.animationControls.startEquipmentAnimations(
        motionUpdate.equipmentAnimations
      );
    }

    return { onTranslationComplete, onAnimationComplete };
  }

  handleEntityMotionSetNewParentUpdate(
    sceneEntity: SceneEntity,
    sceneEntityService: SceneEntityService,
    identifierWithDuration: null | SceneEntityChildTransformNodeIdentifierWithDuration
  ) {
    if (identifierWithDuration === null) {
      return sceneEntity.rootTransformNode.setParent(null);
    }
    const { identifier, duration } = identifierWithDuration;
    const targetTransformNode = sceneEntityService.getChildTransformNodeFromIdentifier(identifier);
    sceneEntity.rootTransformNode.setParent(targetTransformNode);
    sceneEntity.movementManager.startTranslating(Vector3.Zero(), duration, {}, () => {
      // no-op
    });
  }

  despawnAndUnregisterActionEntity(
    gameWorldView: GameWorldView,
    entityId: EntityId,
    cleanupMode: CleanupMode
  ) {
    const { actionEntityManager } = gameWorldView.sceneEntityService;
    actionEntityManager.unregister(entityId, cleanupMode);
  }
}

// removed completion code need to put back in after duration elapsed:
//
// onComplete(){
//   const partyResult = this.clientApplication.gameContext.requireParty();
//   partyResult.actionEntityManager.unregisterActionEntity(motionUpdate.entityId);
// }
