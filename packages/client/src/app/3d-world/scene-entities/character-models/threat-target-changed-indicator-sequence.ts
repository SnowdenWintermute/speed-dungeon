import {
  AssetContainer,
  Color3,
  Matrix,
  Mesh,
  MeshBuilder,
  Quaternion,
  StandardMaterial,
  TransformNode,
  Vector3,
  VertexBuffer,
  VertexData,
} from "@babylonjs/core";
import { useGameStore } from "@/stores/game-store";
import { getGameWorld } from "../../SceneManager";
import getGameAndParty from "@/utils/getGameAndParty";
import { ActionEntityModel } from "../action-entity-models";
import {
  ActionEntityName,
  CombatantBaseChildTransformNodeName,
  SceneEntityType,
} from "@speed-dungeon/common";
import { handleLockRotationToFace } from "../../game-world/replay-tree-manager/entity-motion-update-handlers/handle-lock-rotation-to-face";

export function threatTargetChangedIndicatorSequence() {
  useGameStore.getState().mutateState((gameState) => {
    const gameAndPartyResult = getGameAndParty(gameState.game, gameState.username);
    if (gameAndPartyResult instanceof Error) throw gameAndPartyResult;
    const [game, party] = gameAndPartyResult;

    for (const [monsterId, monster] of Object.entries(party.currentRoom.monsters)) {
      const newThreatTargetIdOption =
        monster.combatantProperties.threatManager?.getHighestThreatCombatantId();
      if (!newThreatTargetIdOption) continue;

      const newTargetCharacterModel = getGameWorld().modelManager.findOne(newThreatTargetIdOption);
      const monsterCharacterModel = getGameWorld().modelManager.findOne(monsterId);

      const targetPos = newTargetCharacterModel.homeLocation.position;

      const lookAtMatrix = Matrix.LookAtLH(
        monsterCharacterModel.homeLocation.position,
        targetPos,
        Vector3.Up()
      );
      // Invert because LookAtLH returns a view matrix
      const worldRotation = Quaternion.FromRotationMatrix(lookAtMatrix).invert();

      monsterCharacterModel.homeLocation.rotation = worldRotation;
      monsterCharacterModel.movementManager.startRotatingTowards(
        monsterCharacterModel.homeLocation.rotation,
        1000,
        () => {}
      );

      const indicatorArrow = spawnTargetChangedIndicatorArrow(
        monsterCharacterModel.movementManager.transformNode.position
      );

      // indicatorArrow.createDebugLines()

      getGameWorld().actionEntityManager.register(indicatorArrow);

      handleLockRotationToFace(indicatorArrow, {
        identifier: {
          sceneEntityIdentifier: {
            type: SceneEntityType.CharacterModel,
            entityId: newThreatTargetIdOption,
          },
          transformNodeName: CombatantBaseChildTransformNodeName.EntityRoot,
        },
        duration: 300,
      });

      const trailWidth = 0.02;
      const trailHeight = 0.02;

      const { trail, positions } = spawnTargetChangedIndicatorTrail(
        monsterCharacterModel.movementManager.transformNode.position,
        trailWidth,
        trailHeight
      );

      const targetCurrentPosition = newTargetCharacterModel.movementManager.transformNode.position;
      indicatorArrow.movementManager.startTranslating(
        targetCurrentPosition,
        600,
        () => {
          getGameWorld().actionEntityManager.unregister(indicatorArrow.entityId);
        },
        () => {
          updateTargetChangedIndicatorTrail(
            indicatorArrow.movementManager.transformNode,
            monsterCharacterModel.homeLocation.position,
            positions,
            trail,
            trailWidth,
            trailHeight
          );
        }
      );
    }
  });
}

function spawnTargetChangedIndicatorArrow(position: Vector3) {
  const mesh = MeshBuilder.CreateCylinder("cylinder", {
    diameterBottom: 0.1,
    diameterTop: 0,
    height: 0.4,
  });

  const material = new StandardMaterial("");
  material.diffuseColor = new Color3(0.9, 0.1, 0.1);
  material.alpha = 0.5;

  // mesh.material = material;
  mesh.position.copyFrom(position);

  mesh.rotate(Vector3.Left(), -Math.PI / 2);

  const model = new AssetContainer();
  model.meshes = [mesh];
  const entityId = getGameWorld().idGenerator.generate();

  const actionEntityModel = new ActionEntityModel(
    entityId,
    model,
    position,
    ActionEntityName.TargetChangedIndicatorArrow
  );

  return actionEntityModel;
}

function spawnTargetChangedIndicatorTrail(startPosition: Vector3, width: number, height: number) {
  const gameWorld = getGameWorld();
  const trail = new Mesh("trail", gameWorld.scene);

  const vertexData = new VertexData();
  const start = startPosition.clone();
  const end = start.clone(); // Will be updated dynamically

  const forward = end.subtract(start).normalize();
  const right = Vector3.Cross(forward, Vector3.Up())
    .normalize()
    .scale(width / 2);
  const up = Vector3.Up().scale(height);

  // Rear face at start position
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  // Define rear face vertices (fixed at start)
  const rearBL = start.subtract(right.scale(halfWidth)).subtract(up.scale(halfHeight)); // bottom-left
  const rearBR = start.add(right.scale(halfWidth)).subtract(up.scale(halfHeight)); // bottom-right
  const rearTR = start.add(right.scale(halfWidth)).add(up.scale(halfHeight)); // top-right
  const rearTL = start.subtract(right.scale(halfWidth)).add(up.scale(halfHeight)); // top-left

  // Initialize front face (placeholder, will be updated during animation)
  const frontBL = rearBL.clone(); // will be updated in animation loop
  const frontBR = rearBR.clone();
  const frontTR = rearTR.clone();
  const frontTL = rearTL.clone();
  const positions = [
    rearBL.x,
    rearBL.y,
    rearBL.z,
    rearBR.x,
    rearBR.y,
    rearBR.z,
    rearTR.x,
    rearTR.y,
    rearTR.z,
    rearTL.x,
    rearTL.y,
    rearTL.z,

    frontBL.x,
    frontBL.y,
    frontBL.z,
    frontBR.x,
    frontBR.y,
    frontBR.z,
    frontTR.x,
    frontTR.y,
    frontTR.z,
    frontTL.x,
    frontTL.y,
    frontTL.z,
  ];

  const indices = [
    // sides connecting front and rear
    0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7,
  ];

  vertexData.positions = positions;
  vertexData.indices = indices;
  trail.setVerticesData(VertexBuffer.PositionKind, positions, true);
  trail.setIndices(indices);
  return { trail, positions };
}

function updateTargetChangedIndicatorTrail(
  arrow: TransformNode,
  startPosition: Vector3,
  positions: number[],
  trail: Mesh,
  width: number,
  height: number
) {
  const arrowPos = arrow.position;
  const dir = arrowPos.subtract(startPosition);
  const right = Vector3.Cross(dir.normalize(), Vector3.Up()).normalize().scale(width);
  const up = Vector3.Up().scale(height);

  positions[12] = arrowPos.x - right.x; // bottom-left
  positions[13] = arrowPos.y;
  positions[14] = arrowPos.z - right.z;

  positions[15] = arrowPos.x + right.x; // bottom-right
  positions[16] = arrowPos.y;
  positions[17] = arrowPos.z + right.z;

  positions[18] = arrowPos.x + right.x; // top-right
  positions[19] = arrowPos.y + up.y;
  positions[20] = arrowPos.z + right.z;

  positions[21] = arrowPos.x - right.x; // top-left
  positions[22] = arrowPos.y + up.y;
  positions[23] = arrowPos.z - right.z;

  trail.updateVerticesData(VertexBuffer.PositionKind, positions);
}
