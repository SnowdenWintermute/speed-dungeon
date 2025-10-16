import {
  AssetContainer,
  Color3,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  TransformNode,
  Vector3,
  VertexBuffer,
  VertexData,
} from "@babylonjs/core";
import { getGameWorld } from "../../../SceneManager";
import { ActionEntityModel } from "../../action-entity-models";
import {
  ActionEntityName,
  CleanupMode,
  CombatantBaseChildTransformNodeName,
  CombatantProperties,
  easeOut,
  NormalizedPercentage,
  SceneEntityType,
} from "@speed-dungeon/common";
import { handleLockRotationToFace } from "../../../game-world/replay-tree-manager/entity-motion-update-handlers/handle-lock-rotation-to-face";
import { AppStore } from "@/mobx-stores/app-store";

export function threatTargetChangedIndicatorSequence() {
  const party = AppStore.get().gameStore.getExpectedParty();

  for (const combatant of party.combatantManager.getAllCombatants()) {
    const { threatManager } = combatant.combatantProperties;
    if (!threatManager) continue;
    if (CombatantProperties.isDead(combatant.combatantProperties)) continue;
    const updatedTopThreat = threatManager.updateHomeRotationToPointTowardNewTopThreatTarget(
      party,
      combatant
    );
    if (!updatedTopThreat) continue;
    const monsterCharacterModel = getGameWorld().modelManager.findOne(combatant.getEntityId());
    monsterCharacterModel.homeLocation.rotation = combatant.combatantProperties.homeRotation;
    monsterCharacterModel.movementManager.startRotatingTowards(
      monsterCharacterModel.homeLocation.rotation,
      1000,
      () => {}
    );

    const indicatorArrow = spawnTargetChangedIndicatorArrow(
      monsterCharacterModel.movementManager.transformNode.position
    );

    getGameWorld().actionEntityManager.register(indicatorArrow);

    const newTargetId = threatManager.getHighestThreatCombatantId();
    if (newTargetId === null) continue;

    const newTargetCharacterModel = getGameWorld().modelManager.findOne(newTargetId);
    const targetCurrentPosition = newTargetCharacterModel.movementManager.transformNode.position;
    indicatorArrow.rootTransformNode.lookAt(targetCurrentPosition);

    handleLockRotationToFace(indicatorArrow, {
      identifier: {
        sceneEntityIdentifier: {
          type: SceneEntityType.CharacterModel,
          entityId: newTargetId,
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

    const distance = Vector3.Distance(
      indicatorArrow.rootTransformNode.position,
      targetCurrentPosition
    );
    // const duration = distance * COMBATANT_TIME_TO_MOVE_ONE_METER * 0.75;
    const duration = 900;

    indicatorArrow.movementManager.startTranslating(
      targetCurrentPosition,
      duration,
      () => {
        getGameWorld().actionEntityManager.unregister(indicatorArrow.entityId, CleanupMode.Soft);
        trail.dispose();
      },
      (percentComplete) => {
        // arrow head opacity
        if (indicatorArrow.rootMesh.material?.alpha !== undefined)
          indicatorArrow.rootMesh.material.alpha = 1 - percentComplete;

        updateTargetChangedIndicatorTrail(
          indicatorArrow.movementManager.transformNode,
          monsterCharacterModel.homeLocation.position,
          positions,
          trail,
          trailWidth,
          trailHeight,
          percentComplete
        );
      },
      easeOut
    );
  }
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

  mesh.material = material;
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

  const material = new StandardMaterial("");
  material.diffuseColor = new Color3(0.9, 0.1, 0.1);
  material.alpha = 0.5;
  trail.material = material;

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
  height: number,
  percentComplete: NormalizedPercentage
) {
  // vertices
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

  // material
  if (trail.material?.alpha !== undefined) trail.material.alpha = 1 - percentComplete;
}
