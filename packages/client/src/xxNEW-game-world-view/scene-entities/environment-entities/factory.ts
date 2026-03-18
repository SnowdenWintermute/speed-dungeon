import { loadAssetContainerIntoScene } from "@/xxNEW-game-world-view/utils/load-asset-container-into-scene";
import { Color3, Material, Quaternion, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";
import { EnvironmentSceneEntity } from ".";
import { ClientAppAssetService, EnvironmentEntityName } from "@speed-dungeon/common";
import { ClientApplication } from "@/client-application";
import {
  HP_COLOR,
  MAIN_ACCENT_COLOR,
  MAIN_BG_COLOR,
  MAIN_TEXT_AND_BORDERS_COLOR,
} from "@/client-consts";
import { MATERIAL_NAMES } from "@/game-world-view/materials/material-colors";
import {
  MaterialCategory,
  MaterialShade,
  PlasticColor,
} from "@/xxNEW-game-world-view/materials/material-colors";
import { GameWorldView } from "@/xxNEW-game-world-view";
import { getEnvironmentModelAssetId } from "./environment-entity-asset-ids";

export class EnvironmentSceneEntityFactory {
  private scene: Scene;
  private assetService: ClientAppAssetService;
  constructor(
    private gameWorldView: GameWorldView,
    private clientApplication: ClientApplication
  ) {
    this.scene = gameWorldView.scene;
    this.assetService = clientApplication.assetService;
  }
  async create(
    id: string,
    name: EnvironmentEntityName,
    position: Vector3,
    rotationQuat?: Quaternion
  ) {
    try {
      const assetContainer = await loadAssetContainerIntoScene(
        this.assetService,
        this.scene,
        getEnvironmentModelAssetId(name)
      );
      const result = new EnvironmentSceneEntity(
        id,
        this.scene,
        assetContainer,
        this.clientApplication.floatingMessagesService,
        position,
        name
      );

      if (rotationQuat) {
        result.rootMesh.rotationQuaternion = rotationQuat;
      }

      if (assetContainer.meshes[0]) {
        assetContainer.meshes[0].position = position;
      }
      const oldMaterials: Material[] = [];

      if (name === EnvironmentEntityName.VendingMachine) {
        for (const mesh of assetContainer.meshes) {
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
            mesh.material =
              this.gameWorldView.materialManager.materialPool.savedMaterials[
                MaterialCategory.Plastic
              ][PlasticColor.Blue].clone("");
          }
          if (materialName === MATERIAL_NAMES.MAIN) {
            mesh.material =
              this.gameWorldView.materialManager.materialPool.savedMaterials[
                MaterialCategory.Metal
              ][MaterialShade.Darkest].clone("");
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
        return result;
      }
    } catch (err) {
      console.trace(err);
    }

    throw new Error("couldn't spawn environment entity");
  }
}
