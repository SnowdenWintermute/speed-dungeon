import { Color3, AssetContainer, Material, StandardMaterial } from "@babylonjs/core";
import { SpawnEnvironmentalModelModelAction } from "../model-actions";
import { importMesh } from "@/app/3d-world/utils";
import { ModelManager } from "..";
import { setAlert } from "@/app/components/alerts";
import { LightestToDarkest, MATERIAL_NAMES, PlasticColor } from "../../materials/material-colors";
import {
  HP_COLOR,
  MAIN_ACCENT_COLOR,
  MAIN_BG_COLOR,
  MAIN_TEXT_AND_BORDERS_COLOR,
} from "@/client_consts";
import { EnvironmentModelTypes } from "@/app/3d-world/scene-entities/environment-models/environment-model-paths";

export class EnvironmentModel {
  constructor(public model: AssetContainer) {}
}

export async function spawnEnvironmentModel(
  action: SpawnEnvironmentalModelModelAction,
  modelManager: ModelManager
) {
  const { path, id } = action;
  try {
    const model = await importMesh(path, modelManager.world.scene);
    modelManager.environmentModels[id] = new EnvironmentModel(model);
    // if (model.transformNodes[0]) model.transformNodes[0].position = action.position;
    if (model.meshes[0]) model.meshes[0].position = action.position;

    let oldMaterials: Material[] = [];

    if (action.modelType === EnvironmentModelTypes.VendingMachine) {
      for (const mesh of model.meshes) {
        const materialName = mesh.material?.name;
        if (mesh.material) oldMaterials.push(mesh.material);

        if (materialName === MATERIAL_NAMES.ACCENT_1) {
          const material = new StandardMaterial("VendingMachineAccent1");
          material.diffuseColor = Color3.FromHexString(MAIN_BG_COLOR);
          mesh.material = material;
        }
        if (materialName === MATERIAL_NAMES.ACCENT_2) {
          const material = new StandardMaterial("VendingMachineAccent2");
          material.diffuseColor = Color3.FromHexString(MAIN_TEXT_AND_BORDERS_COLOR);
          mesh.material = material;
        }
        if (materialName === MATERIAL_NAMES.ACCENT_3) {
          const material = new StandardMaterial("VendingMachineAccent3");
          material.diffuseColor = Color3.FromHexString(HP_COLOR);
          mesh.material = material;
        }
        if (materialName === MATERIAL_NAMES.ALTERNATE) {
          mesh.material = modelManager.world.defaultMaterials.plastic[PlasticColor.Blue].clone("");
        }
        if (materialName === MATERIAL_NAMES.MAIN) {
          mesh.material =
            modelManager.world.defaultMaterials.metal[LightestToDarkest.Darker].clone("");
        }
        if (materialName === "Dark") {
          const material = new StandardMaterial("VendingMachineDark");
          material.diffuseColor = Color3.FromHexString(MAIN_ACCENT_COLOR);
          mesh.material = material;
        }
      }
      for (const material of oldMaterials) {
        material.dispose(true, true, false);
      }
    }
  } catch (err) {
    console.trace(err);
    setAlert("Couldn't spawn environment model - check the console for error trace");
  }
}

// const model = await importMesh(path, modelManager.world.scene);
// modelManager.environmentModels[id] = new EnvironmentModel(model);
// // if (model.transformNodes[0]) model.transformNodes[0].position = action.position;
// if (model.meshes[0]) model.meshes[0].position = action.position;

// let oldMaterials: Material[] = [];

// for (const mesh of model.meshes) {
//   const materialName = mesh.material?.name;
//   if (mesh.material) oldMaterials.push(mesh.material);

//   if (materialName === MATERIAL_NAMES.ACCENT_1) {
//     const material = new StandardMaterial("VendingMachineAccent1");
//     material.diffuseColor = Color3.FromHexString(MAIN_BG_COLOR);
//     mesh.material = material;
//   }
// }

// for (const material of oldMaterials) {
//   material.dispose(true, true, false);
// }
