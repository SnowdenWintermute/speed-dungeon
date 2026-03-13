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
import { GameWorldView } from "@/game-world-view";
import { SceneEntity } from "@/game-world-view/scene-entities";
import { ActionEntityModel } from "@/game-world-view/scene-entities/action-entity-models";

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
  const { transformProperties } = deserialized.combatantProperties;
  const model = await gameWorldView.modelManager.spawnCharacterModel(
    gameWorldView,
    {
      combatant: deserialized,
      homeRotation: transformProperties.homeRotation,
      homePosition: transformProperties.getHomePosition(),
      modelDomPositionElement: null, // vestigial from when we used to spawn directly from next.js
    },
    {
      spawnInDeadPose: deserialized.combatantProperties.isDead(),
      doNotIdle: !!spawnableCombatant.doNotIdle,
    }
  );

  if (model instanceof Error) {
    console.info("model was error");
    throw model;
  }

  if (spawnableCombatant.parentTransformNodeOption) {
    const targetTransformNode = SceneEntity.getChildTransformNodeFromIdentifier(
      spawnableCombatant.parentTransformNodeOption,
      gameWorldView
    );

    model.movementManager.transformNode.setParent(targetTransformNode);
    model.movementManager.transformNode.setPositionWithLocalVector(Vector3.Zero());
    model.movementManager.transformNode.rotationQuaternion = Quaternion.Identity();
  }

  await gameWorldView.modelManager.register(model);
}

async function handleNewSpawnableActionEntity(
  gameWorldView: GameWorldView,
  actionEntity: ActionEntity
) {
  const { actionEntityProperties } = actionEntity;
  const { initialRotation } = actionEntityProperties;

  const position = new Vector3(
    actionEntityProperties.position._x,
    actionEntityProperties.position._y,
    actionEntityProperties.position._z
  );

  const assetContainer = await gameWorldView.actionEntityManager.spawnActionEntityModel(
    actionEntityProperties.name,
    position,
    actionEntityProperties.dimensions
  );

  const model = new ActionEntityModel(
    actionEntity.entityProperties.id,
    assetContainer,
    position,
    actionEntityProperties.name
  );

  gameWorldView.actionEntityManager.register(model);

  if (actionEntityProperties.parentOption) {
    const targetTransformNode = SceneEntity.getChildTransformNodeFromIdentifier(
      actionEntityProperties.parentOption,
      gameWorldView
    );

    model.movementManager.transformNode.setParent(targetTransformNode);
    model.movementManager.transformNode.setPositionWithLocalVector(Vector3.Zero());
    model.movementManager.transformNode.rotationQuaternion = Quaternion.Identity();
  }

  if (actionEntityProperties.initialCosmeticYPosition) {
    const targetTransformNode = SceneEntity.getChildTransformNodeFromIdentifier(
      actionEntityProperties.initialCosmeticYPosition,
      gameWorldView
    );

    model.rootTransformNode.position.y = targetTransformNode.position.y;
  }

  if (actionEntityProperties.initialPointToward) {
    handleStartPointingTowardEntity(model, {
      identifier: actionEntityProperties.initialPointToward,
      duration: 0,
    });
  }

  if (actionEntityProperties.initialLockRotationToFace) {
    handleLockRotationToFace(model, actionEntityProperties.initialLockRotationToFace);
  }

  if (initialRotation) {
    const { _x, _y, _z } = initialRotation;
    model.movementManager.transformNode.rotationQuaternion = Quaternion.FromEulerAngles(_x, _y, _z);
  }
}
