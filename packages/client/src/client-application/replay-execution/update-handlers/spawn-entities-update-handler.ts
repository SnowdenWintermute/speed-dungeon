import {
  ActionEntity,
  Combatant,
  SerializedSpawnedCombatant,
  SpawnableEntityType,
  SpawnEntitiesGameUpdateCommand,
} from "@speed-dungeon/common";
import { Quaternion, Vector3 } from "@babylonjs/core";
import { ReplayGameUpdateTracker } from "../replay-game-update-completion-tracker";
import { ClientApplication } from "@/client-application";
import { GameWorldView } from "@/xxNEW-game-world-view";

export async function spawnEntitiesGameUpdateHandler(
  clientApplication: ClientApplication,
  update: ReplayGameUpdateTracker<SpawnEntitiesGameUpdateCommand>
) {
  const { command } = update;
  const { game, party } = clientApplication.combatantFocus.requireFocusedCharacterContext();

  const promises: Promise<void>[] = [];

  const deserialized: (Combatant | ActionEntity)[] = [];
  for (const entity of command.entities) {
    if (entity.type === SpawnableEntityType.Combatant) {
      const { combatant } = entity;
      const deserialized = Combatant.fromSerialized(combatant);
      deserialized.makeObservable();
      party.combatantManager.addCombatant(deserialized, game);
      if (clientApplication.gameWorldView) {
        promises.push(
          handleNewSpawnableCombatant(clientApplication.gameWorldView, entity, deserialized)
        );
      }
    } else {
      deserialized.push(ActionEntity.fromSerialized(entity));
      if (clientApplication.gameWorldView) {
        const deserialized = ActionEntity.fromSerialized(entity);
        deserialized.makeObservable();
        const { actionEntityManager } = party;
        const battleOption = party.getBattleOption(game);
        actionEntityManager.registerActionEntity(deserialized, battleOption);

        if (clientApplication.gameWorldView) {
          promises.push(
            handleNewSpawnableActionEntity(clientApplication.gameWorldView, entity.actionEntity)
          );
        }
      }
    }
  }

  try {
    // @TODO - waiting for spawn completion will cause stutter
    await Promise.all(promises);

    update.setAsQueuedToComplete();
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

  await combatantSceneEntityManager.register(model);
}

async function handleNewSpawnableActionEntity(
  gameWorldView: GameWorldView,
  actionEntity: ActionEntity
) {
  const { actionEntityProperties } = actionEntity;
  const { initialRotation } = actionEntityProperties;

  const { sceneEntityService } = gameWorldView;
  const { actionEntityManager } = sceneEntityService;

  const sceneEntity = await actionEntityManager.spawnActionEntitySceneEntity(actionEntity);

  actionEntityManager.register(sceneEntity);

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
}
