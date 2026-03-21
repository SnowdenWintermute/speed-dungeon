import { FloatingMessageService } from "@/client-application/event-log/floating-messages-service";
import { SceneEntity } from "../base/index";
import {
  AssetContainer,
  Color4,
  MeshBuilder,
  Quaternion,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import {
  CombatantHoldableChildTransformNodeName,
  ERROR_MESSAGES,
  Equipment,
  EquipmentType,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { getChildMeshByName, paintCubesOnNodes } from "@/game-world-view/utils";

export class EquipmentSceneEntity extends SceneEntity {
  childTransformNodes: Partial<Record<CombatantHoldableChildTransformNodeName, TransformNode>> = {};
  constructor(
    public readonly equipment: Equipment,
    scene: Scene,
    assetContainer: AssetContainer,
    floatingMessagesService: FloatingMessageService,
    public readonly isUsingUniqueMaterialInstances: boolean
  ) {
    super(
      equipment.entityProperties.id,
      scene,
      assetContainer,
      floatingMessagesService,
      Vector3.Zero(),
      new Quaternion()
    );

    this.initChildTransformNodes();
    this.setVisibility(0);
  }

  showDebug(scene: Scene) {
    this.setShowBones(scene);

    for (const [nodeName, transformNode] of iterateNumericEnumKeyedRecord(
      this.childTransformNodes
    )) {
      const markerMesh = MeshBuilder.CreateBox(`debug-box-${this.entityId}-${nodeName}`, {
        size: 0.1,
      });
      markerMesh.setParent(transformNode);
      markerMesh.setPositionWithLocalVector(Vector3.Zero());
    }
    if (!this.assetContainer.meshes[0]) {
      throw new Error(ERROR_MESSAGES.GAME_WORLD.INCOMPLETE_ITEM_FILE);
    }
  }

  initChildTransformNodes(): void {
    if (
      this.equipment.equipmentBaseItemProperties.equipmentType ===
      EquipmentType.TwoHandedRangedWeapon
    ) {
      const nockNode = SceneEntity.createTransformNodeChildOfBone(
        this.rootMesh,
        `${this.entityId}-nock`,
        "String"
      );
      if (!nockNode) console.error("no nock bone found");

      this.childTransformNodes[CombatantHoldableChildTransformNodeName.NockBone] = nockNode;
      const arrowRestNode = SceneEntity.createTransformNodeChildOfBone(
        this.rootMesh,
        `${this.entityId}-arrow-rest`,
        "ArrowRest"
      );
      if (!arrowRestNode) console.error("no arrowRest bone found");
      this.childTransformNodes[CombatantHoldableChildTransformNodeName.ArrowRest] = arrowRestNode;
    }
  }

  customCleanup(): void {
    //
  }

  setShowBones(scene: Scene) {
    const transparentMaterial = new StandardMaterial("");
    transparentMaterial.alpha = 0.3;
    for (const mesh of this.rootMesh.getChildMeshes()) {
      mesh.material = transparentMaterial;
    }
    const cubeSize = 0.02;
    const red = new Color4(255, 0, 0, 1.0);
    const skeletonRootBone = getChildMeshByName(this.rootMesh, "BowArmature");

    if (skeletonRootBone !== undefined) {
      paintCubesOnNodes(skeletonRootBone, cubeSize, red, scene);
    }
  }
}
