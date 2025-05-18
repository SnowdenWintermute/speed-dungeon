import {
  AbstractMesh,
  AssetContainer,
  Color4,
  Quaternion,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import { SceneEntity } from "..";
import {
  CombatantHoldableChildTransformNodeName,
  Consumable,
  ERROR_MESSAGES,
  Equipment,
  EquipmentType,
} from "@speed-dungeon/common";
import { getChildMeshByName, paintCubesOnNodes } from "../../utils";
import { gameWorld } from "../../SceneManager";

export class EquipmentModel extends SceneEntity {
  childTransformNodes: Partial<Record<CombatantHoldableChildTransformNodeName, TransformNode>> = {};
  constructor(
    public readonly equipment: Equipment,
    assetContainer: AssetContainer,
    public readonly isUsingUniqueMaterialInstances: boolean
  ) {
    super(equipment.entityProperties.id, assetContainer, Vector3.Zero(), new Quaternion());

    // this.setShowBones();

    // if (!assetContainer.meshes[0]) throw new Error(ERROR_MESSAGES.GAME_WORLD.INCOMPLETE_ITEM_FILE);
  }

  initRootMesh(assetContainer: AssetContainer): AbstractMesh {
    if (!assetContainer.meshes[0]) throw new Error(ERROR_MESSAGES.GAME_WORLD.INCOMPLETE_ITEM_FILE);

    return assetContainer.meshes[0];
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
      if (!nockNode) throw new Error("no nock bone found");
      this.childTransformNodes[CombatantHoldableChildTransformNodeName.NockBone] = nockNode;
      const arrowRestNode = SceneEntity.createTransformNodeChildOfBone(
        this.rootMesh,
        `${this.entityId}-arrow-rest`,
        "ArrowRest"
      );
      if (!arrowRestNode) throw new Error("no arrowRest bone found");
      this.childTransformNodes[CombatantHoldableChildTransformNodeName.ArrowRest] = arrowRestNode;
    }
  }

  customCleanup(): void {
    //
  }

  setShowBones() {
    const transparentMaterial = new StandardMaterial("");
    transparentMaterial.alpha = 0.3;
    for (const mesh of this.rootMesh.getChildMeshes()) {
      mesh.material = transparentMaterial;
    }
    const cubeSize = 0.02;
    const red = new Color4(255, 0, 0, 1.0);
    const skeletonRootBone = getChildMeshByName(this.rootMesh, "BowArmature");
    if (!gameWorld.current) return;
    if (skeletonRootBone !== undefined)
      paintCubesOnNodes(skeletonRootBone, cubeSize, red, gameWorld.current.scene);
  }
}

export class ConsumableModel extends SceneEntity {
  constructor(
    public readonly consumable: Consumable,
    assetContainer: AssetContainer,
    public readonly isUsingUniqueMaterialInstances: boolean
  ) {
    super(consumable.entityProperties.id, assetContainer, Vector3.Zero(), new Quaternion());

    // this.setShowBones();

    // if (!assetContainer.meshes[0]) throw new Error(ERROR_MESSAGES.GAME_WORLD.INCOMPLETE_ITEM_FILE);
  }

  initRootMesh(assetContainer: AssetContainer): AbstractMesh {
    if (!assetContainer.meshes[0]) throw new Error(ERROR_MESSAGES.GAME_WORLD.INCOMPLETE_ITEM_FILE);

    return assetContainer.meshes[0];
  }

  initChildTransformNodes(): void {}

  customCleanup(): void {
    //
  }
}
