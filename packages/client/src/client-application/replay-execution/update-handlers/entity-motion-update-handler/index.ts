import {
  ActionEntityMotionUpdate,
  AnimationTimingType,
  CombatantMotionUpdate,
  DynamicAnimationName,
  EntityAnimation,
  EntityMotionUpdateCommand,
  EntityTranslation,
  SceneEntityChildTransformNodeIdentifierWithDuration,
  SkeletalAnimationName,
  AnimationType,
  CleanupMode,
  EntityId,
  EntityMotionUpdate,
  SpawnableEntityType,
} from "@speed-dungeon/common";
import { ReplayGameUpdateTracker } from "../../replay-game-update-completion-tracker";
import { plainToInstance } from "class-transformer";
import { Quaternion, Vector3 } from "@babylonjs/core";
import { ClientApplication } from "@/client-application";
import { GameWorldView } from "@/game-world-view";
import { SceneEntity } from "@/game-world-view/scene-entities/base";
import { SceneEntityService } from "@/game-world-view/scene-entity-service/index";
import { CombatantSceneEntity } from "@/game-world-view/scene-entities/combatants";
import { DynamicAnimationManager } from "@/game-world-view/scene-entities/base/scene-entity-animation-manager/dynamic-animation-manager";
import { SkeletalAnimationManager } from "@/game-world-view/scene-entities/base/scene-entity-animation-manager/skeletal-animation-manager";
import { ManagedAnimationOptions } from "@/game-world-view/scene-entities/base/scene-entity-animation-manager";

// @TODO
// removed completion code need to put back in after duration elapsed:
//
// onComplete(){
//   const partyResult = this.clientApplication.gameContext.requireParty();
//   partyResult.actionEntityManager.unregisterActionEntity(motionUpdate.entityId);
// }

export class EntityMotionGameUpdateHandlerCommand {
  private gameWorldView: GameWorldView | null;

  constructor(
    private clientApplication: ClientApplication,
    private updateTracker: ReplayGameUpdateTracker<EntityMotionUpdateCommand>
  ) {
    this.gameWorldView = clientApplication.gameWorldView;
  }

  async execute() {
    const { mainEntityUpdate, auxiliaryUpdates } = this.updateTracker.command;

    this.processChild(mainEntityUpdate);

    if (!auxiliaryUpdates) return;
    for (const auxiliaryUpdate of auxiliaryUpdates) {
      this.processChild(auxiliaryUpdate);
    }
  }

  handleTranslation(
    motionUpdate: EntityMotionUpdate,
    translation: EntityTranslation,
    sceneEntity: SceneEntity,
    sceneEntityService: SceneEntityService,
    onComplete?: () => void
  ) {
    const { gameWorldView } = this;
    if (!gameWorldView) return;

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

  handleAnimation(
    animationManager: SkeletalAnimationManager | DynamicAnimationManager,
    animation: EntityAnimation,
    onComplete?: () => void
  ) {
    const shouldLoop = animation.timing.type === AnimationTimingType.Looping;
    let animationDurationOverrideOption = undefined;
    if (animation.timing.type === AnimationTimingType.Timed) {
      animationDurationOverrideOption = animation.timing.duration;
    }

    const options: ManagedAnimationOptions = {
      shouldLoop,
      animationDurationOverrideOption,
      onComplete: () => {
        // @REFACTOR - probably just don't tell looping animations to onComplete and throw errors if they do
        const neverCompletes = animation.timing.type === AnimationTimingType.Looping;
        if (neverCompletes) {
          return;
        }
        onComplete?.();
      },
    };

    if (animationManager instanceof SkeletalAnimationManager) {
      if (animationManager.playing?.options.onComplete && !animationManager.playing.onCompleteRan) {
        // @REFACTOR - old system note below, could probably remove in new "complete after duration"
        // system of marking replay steps as completed
        // @REFACTOR - We're sidestepping a bug here I don't really understand fully:
        // if we don't run the oncomplete for animations that are interrupted
        // it will never unlock the input since we're often relying on those animations'
        // onComplete functions to know when to unlock input
        // if I tried to put this in the animation manager's cleanup we got a heavy recursion
        // lag but not a crash until the next room was explored
        animationManager.playing.runOnComplete();
      }

      animationManager.startAnimationWithTransition(
        animation.name.name as SkeletalAnimationName,
        animation.smoothTransition ? 500 : 200,
        options
      );
    } else {
      animationManager.startAnimationWithTransition(
        animation.name.name as DynamicAnimationName,
        animation.smoothTransition ? 500 : 0,
        {
          ...options,
        }
      );
    }
  }

  processChild(motionUpdate: EntityMotionUpdate) {
    const { gameWorldView } = this;
    if (!gameWorldView) {
      return;
    }

    const entityTypeHandler = this.getEntityTypeMotionUpdateHandler(gameWorldView, motionUpdate);

    const { sceneEntityService } = gameWorldView;
    const sceneEntity = sceneEntityService.getOptionFromMotionUpdate(motionUpdate);

    if (!sceneEntity) {
      const sceneEntityManager = this.getSceneEntityManagerByEntityType(
        gameWorldView,
        motionUpdate
      );
      const pendingEntitySpawn = sceneEntityManager.pendingEntitySpawns.get(motionUpdate.entityId);
      if (!pendingEntitySpawn) {
        throw new Error("expected entity was not instantiated and is not awaiting spawn");
      }

      console.log("pushed motion update handler to pending entity");
      pendingEntitySpawn.pendingUpdates.push((pendingEntity) => {
        const completionHandlers = entityTypeHandler();
        this.handleUpdate(pendingEntity, motionUpdate, sceneEntityService, completionHandlers);
      });
    } else {
      const completionHandlers = entityTypeHandler();
      console.log("handling motion update handler on existing entity");
      this.handleUpdate(sceneEntity, motionUpdate, sceneEntityService, completionHandlers);
    }
  }

  private getSceneEntityManagerByEntityType(
    gameWorldView: GameWorldView,
    motionUpdate: EntityMotionUpdate
  ) {
    switch (motionUpdate.entityType) {
      case SpawnableEntityType.Combatant:
        return gameWorldView.sceneEntityService.combatantSceneEntityManager;
      case SpawnableEntityType.ActionEntity:
        return gameWorldView.sceneEntityService.actionEntityManager;
    }
  }

  handleUpdate(
    sceneEntity: SceneEntity,
    motionUpdate: EntityMotionUpdate,
    sceneEntityService: SceneEntityService,
    completionHandlers?: {
      onTranslationComplete: () => void;
      onAnimationComplete: () => void;
    }
  ) {
    const { translationOption, rotationOption, animationOption } = motionUpdate;
    if (translationOption) {
      this.handleTranslation(
        motionUpdate,
        translationOption,
        sceneEntity,
        sceneEntityService,
        completionHandlers?.onTranslationComplete
      );
    }

    if (rotationOption) {
      sceneEntity.movementManager.startRotatingTowards(
        plainToInstance(Quaternion, rotationOption.rotation),
        rotationOption.duration,
        () => {}
      );
    }

    if (animationOption) {
      let animationManager: DynamicAnimationManager | SkeletalAnimationManager =
        sceneEntity.skeletalAnimationManager;

      if (animationOption.name.type === AnimationType.Dynamic) {
        animationManager = sceneEntity.dynamicAnimationManager;
      }

      this.handleAnimation(
        animationManager,
        animationOption,
        completionHandlers?.onAnimationComplete
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

    console.log("processActionEntity setParent:", motionUpdate.setParent);
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
      console.log("set parent to null", sceneEntity.entityId);
      sceneEntity.movementManager.transformNode.setParent(null);
      return sceneEntity.movementManager.transformNode.setParent(null);
    }
    const { identifier, duration } = identifierWithDuration;
    const targetTransformNode = sceneEntityService.getChildTransformNodeFromIdentifier(identifier);
    sceneEntity.rootTransformNode.setParent(targetTransformNode);
    sceneEntity.movementManager.startTranslating(Vector3.Zero(), duration, {}, () => {
      // no-op
    });
  }
}
