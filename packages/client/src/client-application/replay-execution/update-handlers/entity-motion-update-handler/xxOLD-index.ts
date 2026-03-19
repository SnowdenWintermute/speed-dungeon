export async function entityMotionGameUpdateHandler(
  clientApplication: ClientApplication,
  updateTracker: ReplayGameUpdateTracker<EntityMotionUpdateCommand>
) {
  const { gameWorldView } = clientApplication;
  const { mainEntityUpdate, auxiliaryUpdates } = updateTracker.command;

  handleEntityMotionUpdate(updateTracker, mainEntityUpdate, true, gameWorldView);

  if (auxiliaryUpdates) {
    for (const auxiliaryUpdate of auxiliaryUpdates) {
      handleEntityMotionUpdate(updateTracker, auxiliaryUpdate, false, gameWorldView);
    }
  }
}

export function handleEntityMotionUpdate(
  update: ReplayGameUpdateTracker<EntityMotionUpdateCommand>,
  motionUpdate: EntityMotionUpdate,
  isMainUpdate: boolean,
  gameWorldView: GameWorldView | null
) {
  const { translationOption, rotationOption, animationOption, delayOption } = motionUpdate;

  let onAnimationComplete = () => {
    // no-op until assigned
  };
  let onTranslationComplete = () => {
    // no-op until assigned
  };

  let cosmeticDestinationYOption = undefined;

  if (motionUpdate.entityType === SpawnableEntityType.ActionEntity) {
    cosmeticDestinationYOption = motionUpdate.cosmeticDestinationY;
    const actionEntityModelOption = gameWorldView.actionEntityManager.findOne(
      motionUpdate.entityId,
      motionUpdate
    );

    let alreadyDespawned = false;

    if (motionUpdate.setParent !== undefined) {
      handleEntityMotionSetNewParentUpdate(actionEntityModelOption, motionUpdate.setParent);
    }

    if (motionUpdate.lockRotationToFace !== undefined) {
      const toUpdate = getSceneEntityToUpdate(gameWorldView, motionUpdate);
      toUpdate.lockRotationToFaceToward(gameWorldView, motionUpdate.lockRotationToFace);
    }

    if (motionUpdate.startPointingToward !== undefined) {
      const toUpdate = getSceneEntityToUpdate(gameWorldView, motionUpdate);
      toUpdate.startPointingTowardEntity(gameWorldView, motionUpdate.startPointingToward);
    }

    const { despawnOnCompleteMode } = motionUpdate;

    onTranslationComplete = () => {
      if (despawnOnCompleteMode !== undefined && !alreadyDespawned) {
        despawnAndUnregisterActionEntity(
          gameWorldView,
          motionUpdate.entityId,
          despawnOnCompleteMode
        );
        alreadyDespawned = true;
      }
    };

    onAnimationComplete = () => {
      if (despawnOnCompleteMode !== undefined && !alreadyDespawned) {
        despawnAndUnregisterActionEntity(
          gameWorldView,
          motionUpdate.entityId,
          despawnOnCompleteMode
        );
        alreadyDespawned = true;
      }
    };

    if (!translationOption && !animationOption && despawnOnCompleteMode !== undefined) {
      despawnAndUnregisterActionEntity(gameWorldView, motionUpdate.entityId, despawnOnCompleteMode);
    }
  }

  if (motionUpdate.entityType === SpawnableEntityType.Combatant) {
    const completionHandlers = handleCombatantMotionUpdate(gameWorldView, motionUpdate, update);
    onAnimationComplete = completionHandlers.onAnimationComplete;
    onTranslationComplete = completionHandlers.onTranslationComplete;
  }

  const updateCompletionTracker = new EntityMotionUpdateCompletionTracker(
    animationOption,
    !!translationOption,
    delayOption || 0,
    update
  );

  if (translationOption) {
    handleMotionUpdateTranslation(
      motionUpdate,
      translationOption,
      cosmeticDestinationYOption,
      updateCompletionTracker,
      update,
      onTranslationComplete,
      gameWorldView
    );
  }

  if (rotationOption) {
    const toUpdate = getSceneEntityToUpdate(gameWorldView, motionUpdate);
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

  if (isMainUpdate && updateCompletionTracker.isComplete()) {
    update.setAsQueuedToComplete();
  }
}

function despawnAndUnregisterActionEntity(
  gameWorldView: GameWorldView,
  entityId: EntityId,
  cleanupMode: CleanupMode
) {
  gameWorldView.actionEntityManager.unregister(entityId, cleanupMode);

  const partyResult = AppStore.get().gameStore.getExpectedParty();
  if (partyResult instanceof Error) {
    return console.error(partyResult);
  } else {
    const { actionEntityManager } = partyResult;
    actionEntityManager.unregisterActionEntity(entityId);
  }
}

function handleCombatantMotionUpdate(
  motionUpdate: CombatantMotionUpdate,
  parentUpdate: ReplayGameUpdateTracker<
    ActionEntityMotionGameUpdateCommand | CombatantMotionGameUpdateCommand
  >,
  gameWorldView: GameWorldView
): { onTranslationComplete: () => void; onAnimationComplete: () => void } {
  const toReturn = {
    onAnimationComplete: () => {},
    onTranslationComplete: () => {},
  };

  const combatant = AppStore.get().gameStore.getExpectedCombatant(motionUpdate.entityId);

  const combatantModelOption = gameWorldView.modelManager.findOne(motionUpdate.entityId);

  if (motionUpdate.setParent !== undefined) {
    handleEntityMotionSetNewParentUpdate(combatantModelOption, motionUpdate.setParent);
  }

  // they are already dead, so don't animate them
  // this happens if a combatant dies from getting counterattacked and the server
  // tells them to "return home"
  if (combatant.combatantProperties.isDead()) {
    parentUpdate.setAsQueuedToComplete();
    return toReturn;
  }

  toReturn.onTranslationComplete = () => {
    if (!motionUpdate.idleOnComplete) {
      return;
    }
    combatantModelOption.startIdleAnimation(500);
  };

  toReturn.onAnimationComplete = () => {
    if (!motionUpdate.idleOnComplete) {
      return;
    }
    combatantModelOption.startIdleAnimation(500);
  };

  if (motionUpdate.equipmentAnimations) {
    combatantModelOption.startEquipmentAnimations(motionUpdate.equipmentAnimations);
  }

  return toReturn;
}
