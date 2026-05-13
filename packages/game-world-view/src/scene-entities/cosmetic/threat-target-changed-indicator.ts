import {
  AssetContainer,
  Color3,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
  VertexBuffer,
  VertexData,
} from "@babylonjs/core";
import { EnvironmentSceneEntity } from "../environment-entities";
import {
  AdventuringParty,
  CleanupMode,
  CombatantBaseChildTransformNodeName,
  CurveType,
  EnvironmentEntityName,
  NormalizedPercentage,
  SceneEntityType,
} from "@speed-dungeon/common";
import { GameWorldView } from "@/game-world-view";

export async function threatTargetChangedIndicatorSequence(
  gameWorldView: GameWorldView,
  partyOptionGetter: () => AdventuringParty | undefined
) {
  // since we debounce this, it could be that the party is not found
  // after leaving a game
  const party = partyOptionGetter();
  if (party === undefined) {
    return;
  }

  const { combatantSceneEntityManager, environmentEntityManager } =
    gameWorldView.sceneEntityService;

  for (const [_, combatant] of party.combatantManager.getAllCombatants()) {
    const { threatManager } = combatant.combatantProperties;
    if (!threatManager) continue;
    if (combatant.combatantProperties.isDead()) continue;
    const updatedTopThreat = threatManager.updateHomeRotationToPointTowardNewTopThreatTarget(
      party,
      combatant
    );
    if (!updatedTopThreat) continue;

    const monsterCharacterModel = combatantSceneEntityManager.requireById(combatant.getEntityId());
    const { transformProperties } = monsterCharacterModel.combatant.combatantProperties;
    monsterCharacterModel.movementManager.startRotatingTowards(
      transformProperties.homeRotation,
      1000,
      () => {}
    );

    const id = gameWorldView.idGenerator.generate();
    await gameWorldView.sceneEntityService.environmentEntityManager.spawnEnvironmentEntity(
      id,
      EnvironmentEntityName.ThreatTargetChangedArrow,
      monsterCharacterModel.movementManager.transformNode.position
    );

    const indicatorArrow =
      gameWorldView.sceneEntityService.environmentEntityManager.requireById(id);

    const newTargetId = threatManager.getHighestThreatCombatantId();
    if (newTargetId === null) continue;

    const newTargetCharacterModel = combatantSceneEntityManager.requireById(newTargetId);
    const targetCurrentPosition = newTargetCharacterModel.movementManager.transformNode.position;
    indicatorArrow.rootTransformNode.lookAt(targetCurrentPosition);

    indicatorArrow.lockRotationToFaceToward(gameWorldView, {
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
      gameWorldView.scene,
      monsterCharacterModel.movementManager.transformNode.position,
      trailWidth,
      trailHeight
    );
    // trail.setParent(indicatorArrow.rootMesh);

    const duration = 900;

    indicatorArrow.movementManager.startTranslating(
      targetCurrentPosition,
      duration,
      { speedCurveOption: CurveType.EaseOut },
      () => {
        environmentEntityManager.unregister(indicatorArrow.entityId, CleanupMode.Soft);
        trail.dispose();
      },
      (percentComplete) => {
        // arrow head opacity
        if (indicatorArrow.rootMesh.material?.alpha !== undefined)
          indicatorArrow.rootMesh.material.alpha = 1 - percentComplete;

        updateTargetChangedIndicatorTrail(
          indicatorArrow.movementManager.transformNode,
          transformProperties.getHomePosition(),
          positions,
          trail,
          trailWidth,
          trailHeight,
          percentComplete
        );
      }
    );
  }
}

export function spawnTargetChangedIndicatorArrow(
  id: string,
  gameWorldView: GameWorldView,
  position: Vector3
) {
  const mesh = MeshBuilder.CreateCylinder(
    "cylinder",
    {
      diameterBottom: 0.1,
      diameterTop: 0,
      height: 0.4,
    },
    gameWorldView.scene
  );

  const material = new StandardMaterial("threat indicator arrow material", gameWorldView.scene);
  material.diffuseColor = new Color3(0.9, 0.1, 0.1);
  material.alpha = 0.5;
  // material.alpha = 0.0;

  mesh.material = material;
  mesh.position.copyFrom(position);

  mesh.rotate(Vector3.Left(), -Math.PI / 2);

  const assetContainer = new AssetContainer(gameWorldView.scene);
  assetContainer.meshes = [mesh];

  const sceneEntity = new EnvironmentSceneEntity(
    id,
    "threat target changed indicator",
    gameWorldView.scene,
    assetContainer,
    gameWorldView.clientApplication.floatingMessagesService,
    position.clone(),
    EnvironmentEntityName.ThreatTargetChangedArrow
  );

  return sceneEntity;
}

function spawnTargetChangedIndicatorTrail(
  scene: Scene,
  startPosition: Vector3,
  width: number,
  height: number
) {
  const trail = new Mesh("trail", scene);

  const material = new StandardMaterial("", scene);
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
