import {
  AdventuringParty,
  ERROR_MESSAGES,
  SpawnEntityGameUpdateCommand,
  SpawnableEntityType,
} from "@speed-dungeon/common";
import {
  ActionEntityModel,
  spawnActionEntityModel,
} from "../../scene-entities/action-entity-models";
import { Quaternion, Vector3 } from "@babylonjs/core";
import { getGameWorld } from "../../SceneManager";
import { SceneEntity } from "../../scene-entities";
import { handleStartPointingTowardEntity } from "./entity-motion-update-handlers/handle-start-pointing-toward";
import { handleLockRotationToFace } from "./entity-motion-update-handlers/handle-lock-rotation-to-face";
import { useGameStore } from "@/stores/game-store";
import getParty from "@/utils/getParty";

export async function spawnEntityGameUpdateHandler(update: {
  command: SpawnEntityGameUpdateCommand;
  isComplete: boolean;
}) {
  const { command } = update;
  if (command.entity.type !== SpawnableEntityType.ActionEntity) {
    console.error("not implemented spawning entities other than action enities in replay tree");
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

  const assetContainer = await spawnActionEntityModel(
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

  update.isComplete = true;

  getGameWorld().actionEntityManager.register(model);

  useGameStore.getState().mutateState((state) => {
    const partyResult = getParty(state.game, state.username);
    if (!(partyResult instanceof Error)) {
      if (state.game === null) throw new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
      const battleOption = AdventuringParty.getBattleOption(partyResult, state.game);
      AdventuringParty.registerActionEntity(partyResult, actionEntity, battleOption);
    }
  });

  if (actionEntityProperties.parentOption) {
    const targetTransformNode = SceneEntity.getChildTransformNodeFromIdentifier(
      actionEntityProperties.parentOption
    );

    model.movementManager.transformNode.setParent(targetTransformNode);
    model.movementManager.transformNode.setPositionWithLocalVector(Vector3.Zero());
    model.movementManager.transformNode.rotationQuaternion = Quaternion.Identity();
  }

  if (actionEntityProperties.initialCosmeticYPosition) {
    const targetTransformNode = SceneEntity.getChildTransformNodeFromIdentifier(
      actionEntityProperties.initialCosmeticYPosition
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
