import {
  AssetContainer,
  Color3,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import {
  ActionEntity,
  ActionEntityName,
  AssetId,
  ClientAppAssetService,
  ShapeType3D,
  TaggedShape3DDimensions,
  invariant,
} from "@speed-dungeon/common";
import { ACTION_ENTITY_NAME_TO_ASSET_ID } from "./action-entity-asset-ids";
import { loadAssetContainerIntoScene } from "@/xxNEW-game-world-view/utils/load-asset-container-into-scene";
import { ActionEntitySceneEntity } from ".";

export class ActionEntitySceneEntityFactory {
  constructor(
    private scene: Scene,
    private assetService: ClientAppAssetService
  ) {}

  async create(actionEntity: ActionEntity) {
    const { name, dimensions, position } = actionEntity.actionEntityProperties;
    const assetContainer = await this.spawnActionEntityModel(name, position, dimensions);

    return new ActionEntitySceneEntity(
      actionEntity.getEntityId(),
      this.scene,
      assetContainer,
      position,
      name
    );
  }

  private async spawnActionEntityModel(
    actionEntityName: ActionEntityName,
    position: Vector3,
    taggedDimensionsOption?: TaggedShape3DDimensions
  ) {
    const assetContainer = await this.ACTION_ENTITY_SCENE_ENTITY_CREATORS[actionEntityName](
      position,
      taggedDimensionsOption
    );

    const parentMesh = assetContainer.meshes[0];
    invariant(parentMesh !== undefined, "expected mesh was missing in imported scene");

    const transformNode = new TransformNode("");
    transformNode.position.copyFrom(parentMesh.position);
    parentMesh.setParent(transformNode);
    assetContainer.transformNodes.push(transformNode);
    return assetContainer;
  }

  async createActionEntityModelFromAssetPath(actionEntityName: ActionEntityName) {
    const assetId = ACTION_ENTITY_NAME_TO_ASSET_ID[actionEntityName] as AssetId;
    return await loadAssetContainerIntoScene(this.assetService, this.scene, assetId);
  }

  ACTION_ENTITY_SCENE_ENTITY_CREATORS: Record<
    ActionEntityName,
    (position: Vector3, dimensions?: TaggedShape3DDimensions) => Promise<AssetContainer>
  > = {
    [ActionEntityName.Arrow]: async () =>
      this.createActionEntityModelFromAssetPath(ActionEntityName.Arrow),
    [ActionEntityName.IceBolt]: async () =>
      this.createActionEntityModelFromAssetPath(ActionEntityName.IceBolt),
    [ActionEntityName.Explosion]: async (position) => {
      const mesh = MeshBuilder.CreateIcoSphere("", { radius: 0.5 });
      const material = new StandardMaterial("");
      material.diffuseColor = new Color3(0.7, 0.3, 0.2);
      material.alpha = 0.5;

      mesh.material = material;
      mesh.position.copyFrom(position);
      const model = new AssetContainer();
      model.meshes = [mesh];
      return model;
    },
    [ActionEntityName.IceBurst]: async (position) => {
      const mesh = MeshBuilder.CreateGoldberg("", { size: 0.35 });
      const material = new StandardMaterial("");
      material.diffuseColor = new Color3(0.2, 0.3, 0.7);
      material.alpha = 0.5;

      mesh.material = material;
      mesh.position.copyFrom(position);
      const assetContainer = new AssetContainer();
      assetContainer.meshes = [mesh];
      return assetContainer;
    },
    [ActionEntityName.TargetChangedIndicatorArrow]: function () {
      throw new Error("Function not implemented.");
    },
    [ActionEntityName.Firewall]: async function (position, taggedDimensions) {
      invariant(taggedDimensions?.type === ShapeType3D.Box, "expected box shape");
      const { width, height, depth } = taggedDimensions.dimensions;
      const mesh = MeshBuilder.CreateBox("", { width, height, depth });
      const material = new StandardMaterial("");
      material.alpha = 0;

      mesh.material = material;
      mesh.position.copyFrom(position);
      const assetContainer = new AssetContainer();
      assetContainer.meshes = [mesh];
      return assetContainer;
    },
  };
}
