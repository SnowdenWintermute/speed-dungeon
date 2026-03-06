import {
  ActionEntity,
  AdventuringParty,
  Combatant,
  SerializedSpawnedCombatant,
  SpawnableEntityType,
  SpawnEntitiesGameUpdateCommand,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { Quaternion, Vector3 } from "@babylonjs/core";
import { handleStartPointingTowardEntity } from "./entity-motion-update-handlers/handle-start-pointing-toward";
import { handleLockRotationToFace } from "./entity-motion-update-handlers/handle-lock-rotation-to-face";
import { GameUpdateTracker } from "./game-update-tracker";
import { AppStore } from "@/mobx-stores/app-store";
import { spawnCharacterModel } from "@/game-world-view/model-manager/model-action-handlers/spawn-character-model";
import { getGameWorldView } from "@/app/game-world-view-canvas/SceneManager";
import { SceneEntity } from "@/game-world-view/scene-entities";
import {
  ActionEntityModel,
  spawnActionEntityModel,
} from "@/game-world-view/scene-entities/action-entity-models";
import { deserialize } from "v8";

export async function spawnEntitiesGameUpdateHandler(
  update: GameUpdateTracker<SpawnEntitiesGameUpdateCommand>
) {
  const { command } = update;
  const { game, party } = AppStore.get().gameStore.getFocusedCharacterContext();

  const promises: Promise<void>[] = [];

  for (const entity of command.entities) {
    if (entity.type === SpawnableEntityType.Combatant) {
      promises.push(handleNewSpawnableCombatant(entity, party, game));
    } else {
      promises.push(handleNewSpawnableActionEntity(entity.actionEntity, party, game));
    }
  }

  try {
    await Promise.all(promises);

    update.setAsQueuedToComplete();
  } catch (error) {
    console.info("some error with spawn entities:", error);
  }
}

async function handleNewSpawnableCombatant(
  spawnableCombatant: SerializedSpawnedCombatant,
  party: AdventuringParty,
  game: SpeedDungeonGame
) {
  const { combatant, parentTransformNodeOption } = spawnableCombatant;
  const deserialized = Combatant.fromSerialized(combatant);
  deserialized.makeObservable();
  const { homeRotation } = deserialized.combatantProperties.transformProperties;
  party.combatantManager.addCombatant(deserialized, game);
  const model = await spawnCharacterModel(
    getGameWorldView(),
    {
      combatant: deserialized,
      homeRotation,
      homePosition: deserialized.combatantProperties.transformProperties.getHomePosition(),
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

  if (parentTransformNodeOption) {
    const targetTransformNode = SceneEntity.getChildTransformNodeFromIdentifier(
      parentTransformNodeOption,
      getGameWorldView()
    );

    model.movementManager.transformNode.setParent(targetTransformNode);
    model.movementManager.transformNode.setPositionWithLocalVector(Vector3.Zero());
    model.movementManager.transformNode.rotationQuaternion = Quaternion.Identity();
  }

  await getGameWorldView().modelManager.register(model);
}

async function handleNewSpawnableActionEntity(
  actionEntity: ActionEntity,
  party: AdventuringParty,
  game: SpeedDungeonGame
) {
  const { actionEntityProperties } = actionEntity;
  const { initialRotation } = actionEntityProperties;
  const battleOption = party.getBattleOption(game);

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

  getGameWorldView().actionEntityManager.register(model);

  const deserialized = ActionEntity.fromSerialized(actionEntity);
  deserialized.makeObservable();

  const { actionEntityManager } = party;
  actionEntityManager.registerActionEntity(deserialized, battleOption);

  if (actionEntityProperties.parentOption) {
    const targetTransformNode = SceneEntity.getChildTransformNodeFromIdentifier(
      actionEntityProperties.parentOption,
      getGameWorldView()
    );

    model.movementManager.transformNode.setParent(targetTransformNode);
    model.movementManager.transformNode.setPositionWithLocalVector(Vector3.Zero());
    model.movementManager.transformNode.rotationQuaternion = Quaternion.Identity();
  }

  if (actionEntityProperties.initialCosmeticYPosition) {
    const targetTransformNode = SceneEntity.getChildTransformNodeFromIdentifier(
      actionEntityProperties.initialCosmeticYPosition,
      getGameWorldView()
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
