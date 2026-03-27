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
  ShapeType3D,
  TaggedShape3DDimensions,
  invariant,
} from "@speed-dungeon/common";
import { ACTION_ENTITY_NAME_TO_ASSET_ID } from "./action-entity-asset-ids";
import { loadAssetContainerIntoScene } from "@/game-world-view/utils/load-asset-container-into-scene";
import { ActionEntitySceneEntity } from ".";
import { ClientApplication } from "@/client-application";
import { GameWorldView } from "@/game-world-view";

export class ActionEntitySceneEntityFactory {
  constructor(
    private gameWorldView: GameWorldView,
    private scene: Scene,
    private clientApplication: ClientApplication
  ) {}

  async create(actionEntity: ActionEntity) {
    const { sceneEntityService } = this.gameWorldView;
    sceneEntityService.actionEntityManager.pendingEntitySpawns.set(actionEntity.getEntityId(), {
      pendingUpdates: [],
    });
    const { name, dimensions, position } = actionEntity.actionEntityProperties;
    const assetContainer = await this.spawnActionEntityModel(name, position, dimensions);

    return new ActionEntitySceneEntity(
      actionEntity.getEntityId(),
      actionEntity.entityProperties.name,
      this.gameWorldView.scene,
      assetContainer,
      this.clientApplication.floatingMessagesService,
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

    const transformNode = new TransformNode("", this.scene);
    transformNode.position.copyFrom(parentMesh.position);
    parentMesh.setParent(transformNode);
    assetContainer.transformNodes.push(transformNode);
    return assetContainer;
  }

  async createActionEntityModelFromAssetPath(actionEntityName: ActionEntityName) {
    const assetId = ACTION_ENTITY_NAME_TO_ASSET_ID[actionEntityName] as AssetId;
    return await loadAssetContainerIntoScene(
      this.clientApplication.assetService,
      this.scene,
      assetId
    );
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
      const mesh = MeshBuilder.CreateIcoSphere("", { radius: 0.5 }, this.scene);
      const material = new StandardMaterial("", this.scene);
      material.diffuseColor = new Color3(0.7, 0.3, 0.2);
      material.alpha = 0.5;

      mesh.material = material;
      mesh.position.copyFrom(position);
      const model = new AssetContainer(this.scene);
      model.meshes = [mesh];
      return model;
    },
    [ActionEntityName.IceBurst]: async (position) => {
      const mesh = MeshBuilder.CreateGoldberg("", { size: 0.35 }, this.scene);
      const material = new StandardMaterial("", this.scene);
      material.diffuseColor = new Color3(0.2, 0.3, 0.7);
      material.alpha = 0.5;

      mesh.material = material;
      mesh.position.copyFrom(position);
      const assetContainer = new AssetContainer(this.scene);
      assetContainer.meshes = [mesh];
      return assetContainer;
    },
    [ActionEntityName.Firewall]: async (position, taggedDimensions) => {
      invariant(taggedDimensions?.type === ShapeType3D.Box, "expected box shape");
      const { width, height, depth } = taggedDimensions.dimensions;
      const mesh = MeshBuilder.CreateBox("", { width, height, depth }, this.scene);
      const material = new StandardMaterial("", this.scene);
      material.alpha = 0;

      mesh.material = material;
      mesh.position.copyFrom(position);
      const assetContainer = new AssetContainer(this.scene);
      assetContainer.meshes = [mesh];
      return assetContainer;
    },
  };
}
