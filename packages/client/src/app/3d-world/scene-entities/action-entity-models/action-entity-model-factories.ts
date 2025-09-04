import { AssetContainer, Color3, MeshBuilder, StandardMaterial, Vector3 } from "@babylonjs/core";
import { ActionEntityName, ERROR_MESSAGES, TaggedShape3DDimensions } from "@speed-dungeon/common";
import { ACTION_ENTITY_NAME_TO_MODEL_PATH } from "./action-entity-model-paths";
import { getGameWorld } from "../../SceneManager";
import { importMesh } from "../../utils";

export const ACTION_ENTITY_MODEL_FACTORIES: Record<
  ActionEntityName,
  (position: Vector3, dimensions?: TaggedShape3DDimensions) => Promise<AssetContainer>
> = {
  [ActionEntityName.Arrow]: async () =>
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
    const model = new AssetContainer();
    model.meshes = [mesh];
    return model;
  },
  [ActionEntityName.TargetChangedIndicatorArrow]: function () {
    throw new Error("Function not implemented.");
  },
  [ActionEntityName.Firewall]: function () {
    throw new Error("Function not implemented.");
  },
};

async function createActionEntityModelFromAssetPath(actionEntityName: ActionEntityName) {
  const modelPath = ACTION_ENTITY_NAME_TO_MODEL_PATH[actionEntityName];
  const scene = getGameWorld().scene;
  if (!scene) throw new Error(ERROR_MESSAGES.GAME_WORLD.NOT_FOUND);
  return await importMesh(modelPath, scene);
}
// export async function spawnActionEntityModel(vfxName: ActionEntityName, position: Vector3) {

//   let model: AssetContainer;
//   if (!modelPath) {
//     switch (vfxName) {
//       case ActionEntityName.IceBurst:
//         break;
//       case ActionEntityName.Arrow:
//       case ActionEntityName.IceBolt:
//       case ActionEntityName.TargetChangedIndicatorArrow:
//       case ActionEntityName.Firewall:
//       case ActionEntityName.Explosion:
//         {
//           // @TODO - organize custom mesh creators for self-made vfx
//           const mesh = MeshBuilder.CreateIcoSphere("", { radius: 0.5 });
//           const material = new StandardMaterial("");
//           material.diffuseColor = new Color3(0.7, 0.3, 0.2);
//           material.alpha = 0.5;

//           mesh.material = material;
//           mesh.position.copyFrom(position);
//           model = new AssetContainer();
//           model.meshes = [mesh];
//         }
//         break;
//     }
//   } else {
//     const scene = gameWorld.current?.scene;
//     if (!scene) throw new Error(ERROR_MESSAGES.GAME_WORLD.NOT_FOUND);
//     model = await importMesh(modelPath, scene);
//   }

//   const parentMesh = model.meshes[0];
//   if (!parentMesh) throw new Error("expected mesh was missing in imported scene");

//   const transformNode = new TransformNode("");
//   transformNode.position.copyFrom(parentMesh.position);
//   parentMesh.setParent(transformNode);
//   model.transformNodes.push(transformNode);
//   return model;
// }
