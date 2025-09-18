import { AssetContainer, Color3, MeshBuilder, StandardMaterial, Vector3 } from "@babylonjs/core";
import {
  ActionEntityName,
  ERROR_MESSAGES,
  ShapeType3D,
  TaggedShape3DDimensions,
} from "@speed-dungeon/common";
import { ACTION_ENTITY_NAME_TO_MODEL_PATH } from "./action-entity-model-paths";
import { getGameWorld } from "../../SceneManager";
import { importMesh } from "../../utils";

export const ACTION_ENTITY_MODEL_FACTORIES: Record<
  ActionEntityName,
  (position: Vector3, dimensions?: TaggedShape3DDimensions) => Promise<AssetContainer>
> = {
  [ActionEntityName.Arrow]: async () =>
    createActionEntityModelFromAssetPath(ActionEntityName.Arrow),
  [ActionEntityName.DummyArrow]: async () =>
    createActionEntityModelFromAssetPath(ActionEntityName.Arrow),
  [ActionEntityName.IceBolt]: async () =>
    createActionEntityModelFromAssetPath(ActionEntityName.IceBolt),
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
    if (taggedDimensions?.type !== ShapeType3D.Box) throw new Error("expected box shape");
    const { width, height, depth } = taggedDimensions.dimensions;
    const mesh = MeshBuilder.CreateBox("", { width, height, depth });
    const material = new StandardMaterial("");
    material.alpha = 0;

    // material.diffuseColor = new Color3(0.7, 0.3, 0.2);
    // material.alpha = 0.5;

    mesh.material = material;
    mesh.position.copyFrom(position);
    const assetContainer = new AssetContainer();
    assetContainer.meshes = [mesh];
    return assetContainer;
  },
};

async function createActionEntityModelFromAssetPath(actionEntityName: ActionEntityName) {
  const modelPath = ACTION_ENTITY_NAME_TO_MODEL_PATH[actionEntityName];
  const scene = getGameWorld().scene;
  if (!scene) throw new Error(ERROR_MESSAGES.GAME_WORLD.NOT_FOUND);
  return await importMesh(modelPath, scene);
}
