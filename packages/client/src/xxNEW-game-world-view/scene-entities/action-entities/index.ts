import {
  AssetContainer,
  MeshBuilder,
  TransformNode,
  Vector3,
  Quaternion,
  AbstractMesh,
  Scene,
} from "@babylonjs/core";
import {
  ActionEntityBaseChildTransformNodeName,
  ActionEntityName,
  EntityId,
} from "@speed-dungeon/common";
import { SceneEntity } from "../base";

export class ActionEntitySceneEntity extends SceneEntity {
  childTransformNodes: Partial<Record<ActionEntityBaseChildTransformNodeName, TransformNode>> = {};
  constructor(
    public id: EntityId,
    private scene: Scene,
    assetContainer: AssetContainer,
    startPosition: Vector3,
    public name: ActionEntityName
  ) {
    super(id, assetContainer, startPosition, new Quaternion());

    this.initChildTransformNodes();
  }

  initChildTransformNodes(): void {
    this.childTransformNodes[ActionEntityBaseChildTransformNodeName.EntityRoot] =
      this.rootTransformNode;
  }

  createDebugLines(startPosition: Vector3) {
    const sceneOption = this.scene;
    const start = startPosition;
    const positiveZ = startPosition.add(new Vector3(0, 0, 1));

    const positiveZline = MeshBuilder.CreateLines(
      "line",
      {
        points: [start, positiveZ],
      },
      sceneOption
    );
    const negativeZ = startPosition.add(new Vector3(0, 0, -1));
    const negativeZline = MeshBuilder.CreateLines(
      "line",
      {
        points: [start, negativeZ],
      },
      sceneOption
    );

    positiveZline.setPositionWithLocalVector(Vector3.Zero());
    positiveZline.setParent(this.rootTransformNode);
    negativeZline.setPositionWithLocalVector(Vector3.Zero());
    negativeZline.setParent(this.rootTransformNode);

    const testMesh = MeshBuilder.CreateBox("", { size: 0.1 });
    testMesh.setParent(this.rootTransformNode);
    testMesh.setPositionWithLocalVector(Vector3.Zero());
  }

  initRootMesh(assetContainer: AssetContainer): AbstractMesh {
    const rootMesh = assetContainer.meshes[0];
    if (!rootMesh) throw new Error("no meshes found");
    return rootMesh;
  }

  customCleanup() {
    //
  }
}
