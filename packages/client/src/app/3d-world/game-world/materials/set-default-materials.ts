import { ISceneLoaderAsyncResult } from "@babylonjs/core";
import { DEFAULT_MATERIAL_COLORS } from "./material-colors";
import { SavedMaterials } from "./create-default-materials";

export default function setDefaultMaterials(
  model: ISceneLoaderAsyncResult,
  materialsList: SavedMaterials
) {
  for (const [name, color] of Object.entries(DEFAULT_MATERIAL_COLORS)) {
    for (const mesh of model.meshes) {
      if (mesh.material?.name === name) {
        const materialOption = materialsList.default[name];
        if (materialOption) mesh.material = materialOption;
      }
    }
  }
}
