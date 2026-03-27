import { loadAssetContainerIntoScene } from "@/game-world-view/utils/load-asset-container-into-scene";
import { Color3, Material, Quaternion, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";
import { EnvironmentSceneEntity } from ".";
import {
  AssetId,
  ClientAppAssetService,
  ENVIRONMENT_ENTITY_STRINGS,
  EnvironmentEntityName,
} from "@speed-dungeon/common";
import { ClientApplication } from "@/client-application";
import {
  HP_COLOR,
  MAIN_ACCENT_COLOR,
  MAIN_BG_COLOR,
  MAIN_TEXT_AND_BORDERS_COLOR,
} from "@/client-consts";
import { MATERIAL_LABEL_STRINGS, MaterialLabel } from "@/game-world-view/materials/material-colors";
import {
  MaterialCategory,
  MaterialShade,
  PlasticColor,
} from "@/game-world-view/materials/material-colors";
import { GameWorldView } from "@/game-world-view";
import { getEnvironmentModelAssetId } from "./environment-entity-asset-ids";
import { spawnTargetChangedIndicatorArrow } from "../cosmetic/threat-target-changed-indicator";

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
    const { sceneEntityService } = this.gameWorldView;
    sceneEntityService.environmentEntityManager.pendingEntitySpawns.set(id, {
      pendingUpdates: [],
    });

    const assetIdOption = getEnvironmentModelAssetId(name);
    if (assetIdOption && name !== EnvironmentEntityName.ThreatTargetChangedArrow) {
      return this.createFromAssetId(assetIdOption, id, name, position, rotationQuat);
    } else if (name === EnvironmentEntityName.ThreatTargetChangedArrow) {
      return spawnTargetChangedIndicatorArrow(id, this.gameWorldView, position);
    } else {
      throw new Error("unknown environment entity");
    }
  }

  private async createFromAssetId(
    assetId: AssetId,
    id: string,
    name: EnvironmentEntityName,
    position: Vector3,
    rotationQuat?: Quaternion
  ) {
    try {
      const assetContainer = await loadAssetContainerIntoScene(
        this.assetService,
        this.scene,
        assetId
      );
      const result = new EnvironmentSceneEntity(
        id,
        ENVIRONMENT_ENTITY_STRINGS[name],
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

          if (materialName === MATERIAL_LABEL_STRINGS[MaterialLabel.Accent1]) {
            const material = new StandardMaterial("VendingMachineAccent1", this.scene);
            material.diffuseColor = Color3.FromHexString(MAIN_BG_COLOR);
            mesh.material = material;
          }
          if (materialName === MATERIAL_LABEL_STRINGS[MaterialLabel.Accent2]) {
            const material = new StandardMaterial("VendingMachineAccent2", this.scene);
            material.diffuseColor = Color3.FromHexString(MAIN_TEXT_AND_BORDERS_COLOR);
            mesh.material = material;
          }
          if (materialName === MATERIAL_LABEL_STRINGS[MaterialLabel.Accent3]) {
            const material = new StandardMaterial("VendingMachineAccent3", this.scene);
            material.diffuseColor = Color3.FromHexString(HP_COLOR);
            mesh.material = material;
          }
          if (materialName === MATERIAL_LABEL_STRINGS[MaterialLabel.Alternate]) {
            mesh.material =
              this.gameWorldView.materialManager.materialPool.savedMaterials[
                MaterialCategory.Plastic
              ][PlasticColor.Blue].clone("");
          }
          if (materialName === MATERIAL_LABEL_STRINGS[MaterialLabel.Main]) {
            mesh.material =
              this.gameWorldView.materialManager.materialPool.savedMaterials[
                MaterialCategory.Metal
              ][MaterialShade.Darkest].clone("");
          }
          if (materialName === "Dark") {
            const material = new StandardMaterial("VendingMachineDark", this.scene);
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
