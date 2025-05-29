import { AssetContainer, StandardMaterial } from "@babylonjs/core";

export function applyMaterialsToModelMeshes(
  assetContainer: AssetContainer,
  materialNamesToMaterials: { [materialName: string]: StandardMaterial },
  createUniqueInstance: boolean
) {
  for (const mesh of assetContainer.meshes) {
    for (const [materialName, material] of Object.entries(materialNamesToMaterials))
      if (mesh.material?.name === materialName) {
        const oldMaterial = mesh.material;

        if (createUniqueInstance) {
          const uniqueInstance = new StandardMaterial(materialName);
          uniqueInstance.emissiveColor.r = material.emissiveColor.r;
          uniqueInstance.emissiveColor.g = material.emissiveColor.g;
          uniqueInstance.emissiveColor.b = material.emissiveColor.b;
          uniqueInstance.diffuseColor.r = material.diffuseColor.r;
          uniqueInstance.diffuseColor.g = material.diffuseColor.g;
          uniqueInstance.diffuseColor.b = material.diffuseColor.b;
          uniqueInstance.roughness = material.roughness;
          uniqueInstance.specularColor.r = material.specularColor.r;
          uniqueInstance.specularColor.g = material.specularColor.g;
          uniqueInstance.specularColor.b = material.specularColor.b;
          uniqueInstance.specularPower = material.specularPower;
          mesh.material = uniqueInstance;
          assetContainer.materials.push(uniqueInstance); // so it can be properly disposed later
        } else mesh.material = material;
        oldMaterial.dispose();
      }
  }
}
