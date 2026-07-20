import {
  ActionEntity,
  Combatant,
  getActionEntityPersistentCosmeticEffects,
  SerializedSpawnedCombatant,
  SpawnableEntityType,
  SpawnEntitiesGameUpdateCommand,
} from "@speed-dungeon/common";
import { Quaternion, Vector3 } from "@babylonjs/core";
import { ClientApplication } from "@/client-application";
import { GameWorldView } from "@/game-world-view";
import { isExpectedSceneDisposedError } from "@/game-world-view/utils/load-asset-container-into-scene";
import { ReplayStepExecution } from "../replay-step-execution";

export async function spawnEntitiesGameUpdateHandler(
  clientApplication: ClientApplication,
  stepExecution: ReplayStepExecution<SpawnEntitiesGameUpdateCommand>
) {
  const { command } = stepExecution;
  const { game, party } = clientApplication.combatantFocus.requireFocusedCharacterContext();

  const promises: Promise<void>[] = [];

  const deserialized: (Combatant | ActionEntity)[] = [];
  for (const { entity, withDelay } of command.entities) {
    if (entity.type === SpawnableEntityType.Combatant) {
      const { combatant } = entity;
      const deserialized = Combatant.fromSerialized(combatant);
      deserialized.makeObservable();
      party.combatantManager.addCombatant(deserialized, game, withDelay);
      if (clientApplication.gameWorldView) {
        promises.push(
          handleNewSpawnableCombatant(clientApplication.gameWorldView, entity, deserialized)
        );
      }
    } else {
      const actionEntity = ActionEntity.fromSerialized(entity.actionEntity);
      deserialized.push(actionEntity);
      actionEntity.makeObservable();
      const { actionEntityManager } = party;
      const battleOption = party.getBattleOption(game);
      actionEntityManager.registerActionEntity(actionEntity, battleOption);

      if (clientApplication.gameWorldView) {
        promises.push(
          handleNewSpawnableActionEntity(clientApplication.gameWorldView, actionEntity)
        );
      }
    }
  }

  try {
    // @TODO - waiting for spawn completion will cause stutter
    await Promise.all(promises);
  } catch (error) {
    console.info("some error with spawn entities:", error);
  }
}

async function handleNewSpawnableCombatant(
  gameWorldView: GameWorldView,
  spawnableCombatant: SerializedSpawnedCombatant,
  deserialized: Combatant
) {
  const { sceneEntityService } = gameWorldView;
  const { combatantSceneEntityManager } = sceneEntityService;

  const model = await combatantSceneEntityManager.factory.create(deserialized, {
    spawnInDeadPose: deserialized.combatantProperties.isDead(),
    doNotIdle: !!spawnableCombatant.doNotIdle,
  });

  if (spawnableCombatant.parentTransformNodeOption) {
    const targetTransformNode = sceneEntityService.getChildTransformNodeFromIdentifier(
      spawnableCombatant.parentTransformNodeOption
    );

    model.movementManager.transformNode.setParent(targetTransformNode);
    model.movementManager.transformNode.setPositionWithLocalVector(Vector3.Zero());
    model.movementManager.transformNode.rotationQuaternion = Quaternion.Identity();
  }

  const applyUpdatesQueuedWhileSpawning = await combatantSceneEntityManager.register(model);
  applyUpdatesQueuedWhileSpawning();
}

// respawn scene models for persistent action entities (e.g. a firewall) that already live in party
// state. a GameFullUpdate (reconnection/refresh) re-deserializes them but leaves the scene without
// their models and without the cosmetic effects (like the firewall's particles) that live play would
// have started via a replay command we won't receive again. safe to call whenever the scene mounts or
// a full update lands; entities that already have a model are skipped.
export async function synchronizeActionEntityModels(clientApplication: ClientApplication) {
  const { gameWorldView } = clientApplication;
  if (!gameWorldView || gameWorldView.scene.isDisposed) {
    return;
  }
  const { partyOption } = clientApplication.gameContext;
  if (!partyOption) {
    return;
  }

  const { sceneEntityService } = gameWorldView;
  const { actionEntityManager } = sceneEntityService;

  const promises: Promise<void>[] = [];
  for (const [entityId, actionEntity] of partyOption.actionEntityManager.getActionEntities()) {
    // skip entities that already have a model or are mid-spawn so overlapping syncs (scene mount
    // plus the scheduled full-update event) don't try to spawn the same one twice
    if (
      actionEntityManager.getOptional(entityId) !== undefined ||
      actionEntityManager.pendingEntitySpawns.has(entityId)
    ) {
      continue;
    }
    promises.push(
      handleNewSpawnableActionEntity(gameWorldView, actionEntity)
        .then(() => {
          if (gameWorldView.scene.isDisposed) {
            return;
          }
          sceneEntityService.queueCosmeticEffectsStart(
            getActionEntityPersistentCosmeticEffects(actionEntity)
          );
        })
        .catch((error) => {
          if (!isExpectedSceneDisposedError(error)) {
            console.error("error spawning action entity model", error);
          }
        })
    );
  }

  await Promise.all(promises);
}

export async function handleNewSpawnableActionEntity(
  gameWorldView: GameWorldView,
  actionEntity: ActionEntity
) {
  const { actionEntityProperties } = actionEntity;
  const { initialRotation } = actionEntityProperties;

  const { sceneEntityService } = gameWorldView;
  const { actionEntityManager } = sceneEntityService;

  const sceneEntity = await actionEntityManager.spawnActionEntitySceneEntity(actionEntity);

  const applyUpdatesQueuedWhileSpawning = await actionEntityManager.register(sceneEntity);

  if (actionEntityProperties.parentOption) {
    const targetTransformNode = sceneEntityService.getChildTransformNodeFromIdentifier(
      actionEntityProperties.parentOption
    );

    const { movementManager } = sceneEntity;
    movementManager.transformNode.setParent(targetTransformNode);
    movementManager.transformNode.setPositionWithLocalVector(Vector3.Zero());
    movementManager.transformNode.rotationQuaternion = Quaternion.Identity();
  }

  if (actionEntityProperties.initialCosmeticYPosition) {
    const targetTransformNode = sceneEntityService.getChildTransformNodeFromIdentifier(
      actionEntityProperties.initialCosmeticYPosition
    );

    sceneEntity.rootTransformNode.position.y = targetTransformNode.position.y;
  }

  if (actionEntityProperties.initialPointToward) {
    sceneEntity.startPointingTowardEntity(gameWorldView, {
      identifier: actionEntityProperties.initialPointToward,
      duration: 0,
    });
  }

  if (actionEntityProperties.initialLockRotationToFace) {
    sceneEntity.lockRotationToFaceToward(
      gameWorldView,
      actionEntityProperties.initialLockRotationToFace
    );
  }

  if (initialRotation) {
    const { _x, _y, _z } = initialRotation;
    sceneEntity.movementManager.transformNode.rotationQuaternion = Quaternion.FromEulerAngles(
      _x,
      _y,
      _z
    );
  }

  applyUpdatesQueuedWhileSpawning();
}
