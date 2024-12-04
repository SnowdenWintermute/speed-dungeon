import { ISceneLoaderAsyncResult, StandardMaterial } from "@babylonjs/core";

export default function applyMaterialsToModelMeshes(
  model: ISceneLoaderAsyncResult,
  materialNamesToMaterials: { [materialName: string]: StandardMaterial }
) {
  for (const mesh of model.meshes) {
    for (const [materialName, material] of Object.entries(materialNamesToMaterials))
      if (mesh.material?.name === materialName) {
        const oldMaterial = mesh.material;
        mesh.material = material;
        oldMaterial.dispose();
      }
  }
}
