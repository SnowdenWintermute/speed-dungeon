import { AbstractMesh, AssetContainer, Quaternion, Scene, Vector3 } from "@babylonjs/core";
import { SceneEntity } from "../base/index";
import { Consumable, ERROR_MESSAGES } from "@speed-dungeon/common";
import { FloatingMessageService } from "@/client-application/event-log/floating-messages-service";

export class ConsumableItemSceneEntity extends SceneEntity {
  constructor(
    readonly consumable: Consumable,
    scene: Scene,
    assetContainer: AssetContainer,
    floatingMessagesService: FloatingMessageService,
    readonly isUsingUniqueMaterialInstances: boolean
  ) {
    super(
      consumable.entityProperties.id,
      scene,
      assetContainer,
      floatingMessagesService,
      Vector3.Zero(),
      new Quaternion()
    );
  }

  initChildTransformNodes(): void {
    //
  }

  customCleanup(): void {
    //
  }
}
