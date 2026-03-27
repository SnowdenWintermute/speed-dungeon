import { AssetContainer, TransformNode, Vector3, Quaternion, Scene } from "@babylonjs/core";
import {
  ActionEntityName,
  EntityId,
  GenericBaseChildTransformNodeName,
} from "@speed-dungeon/common";
import { SceneEntity } from "../base";
import { FloatingMessageService } from "@/client-application/event-log/floating-messages-service";

export class ActionEntitySceneEntity extends SceneEntity {
  childTransformNodes: Partial<Record<GenericBaseChildTransformNodeName, TransformNode>> = {};
  constructor(
    public id: EntityId,
    stringName: string,
    scene: Scene,
    assetContainer: AssetContainer,
    floatingMessagesService: FloatingMessageService,
    startPosition: Vector3,
    public name: ActionEntityName
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
