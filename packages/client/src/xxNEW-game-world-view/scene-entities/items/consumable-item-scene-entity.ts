import { AbstractMesh, AssetContainer, Quaternion, Vector3 } from "@babylonjs/core";
import { SceneEntity } from "../base/index";
import { Consumable, ERROR_MESSAGES } from "@speed-dungeon/common";

export class ConsumableItemSceneEntity extends SceneEntity {
  constructor(
    readonly consumable: Consumable,
    assetContainer: AssetContainer,
    readonly isUsingUniqueMaterialInstances: boolean
  ) {
    super(consumable.entityProperties.id, assetContainer, Vector3.Zero(), new Quaternion());
  }

  initRootMesh(assetContainer: AssetContainer): AbstractMesh {
    if (!assetContainer.meshes[0]) throw new Error(ERROR_MESSAGES.GAME_WORLD.INCOMPLETE_ITEM_FILE);

    return assetContainer.meshes[0];
  }

  initChildTransformNodes(): void {
    //
  }

  customCleanup(): void {
    //
  }
}
