import {
  AbstractMesh,
  AssetContainer,
  Color4,
  Quaternion,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import { SceneEntity } from "..";
import { ERROR_MESSAGES, Item } from "@speed-dungeon/common";
import { getChildMeshByName, paintCubesOnNodes } from "../../utils";
import { gameWorld } from "../../SceneManager";

export class ItemModel extends SceneEntity {
  constructor(
    public readonly item: Item,
    assetContainer: AssetContainer,
    public readonly isUsingUniqueMaterialInstances: boolean
  ) {
    super(item.entityProperties.id, assetContainer, Vector3.Zero(), new Quaternion());

    // this.setShowBones();

    // if (!assetContainer.meshes[0]) throw new Error(ERROR_MESSAGES.GAME_WORLD.INCOMPLETE_ITEM_FILE);
  }

  initRootMesh(assetContainer: AssetContainer): AbstractMesh {
    if (!assetContainer.meshes[0]) throw new Error(ERROR_MESSAGES.GAME_WORLD.INCOMPLETE_ITEM_FILE);

    return assetContainer.meshes[0];
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
