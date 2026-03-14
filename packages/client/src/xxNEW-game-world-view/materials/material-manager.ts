import { AbstractMesh, AssetContainer, Scene, StandardMaterial } from "@babylonjs/core";
import { MaterialPool } from "./material-pool";

export const DYNAMIC_MATERIAL_TAG = "-dynamic-material";

export class MaterialManager {
  materialPool: MaterialPool;
  constructor(private scene: Scene) {
    this.materialPool = new MaterialPool(scene);
  }

  applyMaterialsToModelMeshes(
    assetContainer: AssetContainer,
    materialNamesToMaterials: { [materialName: string]: StandardMaterial },
    createUniqueInstance: boolean
  ) {
    for (const mesh of assetContainer.meshes) {
      for (const [materialName, material] of Object.entries(materialNamesToMaterials)) {
        if (mesh.material?.name !== materialName) {
          continue;
        }
        this.replaceMaterialOnMesh(mesh, assetContainer, material, createUniqueInstance);
      }
    }
  }

  private replaceMaterialOnMesh(
    mesh: AbstractMesh,
    container: AssetContainer,
    material: StandardMaterial,
    createUniqueInstance: boolean
  ) {
    const oldMaterial = mesh.material;

    if (createUniqueInstance) {
      const uniqueInstance = material.clone(material.name);
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
      uniqueInstance.alpha = material.alpha;
      mesh.material = uniqueInstance;
      container.materials.push(uniqueInstance); // so it can be properly disposed later
    } else {
      mesh.material = material;
    }
    oldMaterial?.dispose();
  }
}
