import { SpawnEntityGameUpdateCommand, SpawnableEntityType } from "@speed-dungeon/common";
import {
  ActionEntityModel,
  spawnActionEntityModel,
} from "../../scene-entities/action-entity-models";
import { Quaternion, Vector3 } from "@babylonjs/core";
import { getGameWorld } from "../../SceneManager";
import { SceneEntity } from "../../scene-entities";

export async function spawnEntityGameUpdateHandler(update: {
  command: SpawnEntityGameUpdateCommand;
  isComplete: boolean;
}) {
  const { command } = update;
  if (command.entity.type !== SpawnableEntityType.ActionEntity) {
    update.isComplete = true;
    return;
  }

  const { actionEntity } = command.entity;
  const { actionEntityProperties } = actionEntity;
  const { initialRotation } = actionEntityProperties;

  const position = new Vector3(
    actionEntityProperties.position._x,
    actionEntityProperties.position._y,
    actionEntityProperties.position._z
  );

  const assetContainer = await spawnActionEntityModel(actionEntityProperties.name, position);

  const model = new ActionEntityModel(
    actionEntity.entityProperties.id,
    assetContainer,
    position,
    actionEntityProperties.name
  );

  update.isComplete = true;

  getGameWorld().actionEntityManager.register(model);

  if (actionEntityProperties.parentOption) {
    const targetTransformNode = SceneEntity.getChildTransformNodeFromIdentifier(
      actionEntityProperties.parentOption
    );

    model.movementManager.transformNode.setParent(targetTransformNode);
    model.movementManager.transformNode.setPositionWithLocalVector(Vector3.Zero());
    model.movementManager.transformNode.rotationQuaternion = Quaternion.Identity();
  }

  if (initialRotation) {
    const { _x, _y, _z } = initialRotation;
    model.movementManager.transformNode.rotationQuaternion = Quaternion.FromEulerAngles(_x, _y, _z);
  }
}
