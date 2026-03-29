import {
  EntityId,
  EnvironmentEntityName,
  GenericBaseChildTransformNodeName,
} from "@speed-dungeon/common";
import { SceneEntity } from "../base";
import { AssetContainer, Quaternion, Scene, TransformNode, Vector3 } from "@babylonjs/core";
import { FloatingMessageService } from "@/client-application/event-log/floating-messages-service";

export class EnvironmentSceneEntity extends SceneEntity {
  childTransformNodes: Partial<Record<GenericBaseChildTransformNodeName, TransformNode>> = {};

  constructor(
    public id: EntityId,
    stringName: string,
    scene: Scene,
    assetContainer: AssetContainer,
    floatingMessagesService: FloatingMessageService,
    startPosition: Vector3,
    public name: EnvironmentEntityName
  ) {
    super(
      id,
      stringName,
      scene,
      assetContainer,
      floatingMessagesService,
      startPosition,
      new Quaternion()
    );

    this.initChildTransformNodes();
  }

  initChildTransformNodes() {
    this.childTransformNodes[GenericBaseChildTransformNodeName.EntityRoot] = this.rootTransformNode;
  }

  customCleanup() {
    //
  }
}
