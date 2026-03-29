import {
  AssetId,
  ClientAppAssetService,
  Combatant,
  CombatantProperties,
  CombatantSpecies,
  MonsterType,
  SKELETON_FILE_PATHS,
} from "@speed-dungeon/common";
import { GameWorldView } from "../..";
import { CombatantSceneEntity } from ".";
import { loadAssetContainerIntoScene } from "@/game-world-view/utils/load-asset-container-into-scene";
import { ClientApplication } from "@/client-application";
import { MONSTER_SCALING_SIZES } from "./species-scaling-sizes";
import { AssetContainer, Color3, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";
import { getCombatantSceneEntityPartCategoriesAndAssetPaths } from "./modular-parts-manager/asset-paths";

export class CombatantSceneEntityFactory {
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
    combatant: Combatant,
    options?: { spawnInDeadPose?: boolean; doNotIdle?: boolean }
  ): Promise<CombatantSceneEntity> {
    this.gameWorldView.sceneEntityService.combatantSceneEntityManager.pendingEntitySpawns.set(
      combatant.getEntityId(),
      { pendingUpdates: [] }
    );

    const { combatantProperties } = combatant;

    const skeletonPath = SKELETON_FILE_PATHS[combatantProperties.combatantSpecies] as AssetId;

    const skeleton = await loadAssetContainerIntoScene(this.assetService, this.scene, skeletonPath);

    const sceneEntity = new CombatantSceneEntity(
      this.gameWorldView,
      this.clientApplication,
      combatant,
      skeleton
    );

    await this.attachModularParts(sceneEntity);

    this.setScaling(sceneEntity, combatantProperties);

    sceneEntity.initChildTransformNodes();

    const shouldSyncEquipment = combatantProperties.combatantSpecies === CombatantSpecies.Humanoid;
    if (shouldSyncEquipment) {
      sceneEntity.equipmentManager.synchronizeCombatantEquipmentModels();
    }

    sceneEntity.bounding.updateBox();
    this.setStartingAnimation(sceneEntity, options);
    sceneEntity.setVisibility(1);

    return sceneEntity;
  }

  private setStartingAnimation(
    sceneEntity: CombatantSceneEntity,
    options?: { spawnInDeadPose?: boolean; doNotIdle?: boolean }
  ) {
    if (options?.spawnInDeadPose) {
      sceneEntity.setToDeadPose();
    } else if (!options?.doNotIdle) {
      sceneEntity.animationControls.startIdleAnimation(0, {});
    }
  }

  private async attachModularParts(sceneEntity: CombatantSceneEntity) {
    const { combatantProperties } = sceneEntity.combatant;
    const partAssetIds = getCombatantSceneEntityPartCategoriesAndAssetPaths(combatantProperties);
    const partPromises: Promise<AssetContainer>[] = [];

    for (const part of partAssetIds) {
      const { assetPath } = part;
      if (!assetPath || assetPath === "") {
        console.error("no part asset path provided for part", part);
        continue;
      }

      partPromises.push(
        new Promise((resolve, _reject) => {
          sceneEntity.modularPartsManager
            .attachPart(this.scene, part.category, assetPath as AssetId)
            .then((part) => {
              this.setCombatantSceneEntityPartDefaultMaterials(part, combatantProperties);
              resolve(part);
            })
            .catch((error) => {
              console.error(error);
            });
        })
      );
    }

    return await Promise.all(partPromises);
  }

  private setScaling(sceneEntity: CombatantSceneEntity, combatantProperties: CombatantProperties) {
    const { scaleModifier } = combatantProperties.transformProperties;
    if (combatantProperties.transformProperties.scaleModifier) {
      sceneEntity.rootTransformNode.scaling = new Vector3(
        scaleModifier,
        scaleModifier,
        scaleModifier
      );
    }

    if (combatantProperties.monsterType !== null) {
      const defaultScalingModifier = MONSTER_SCALING_SIZES[combatantProperties.monsterType];
      sceneEntity.rootTransformNode.scaling =
        sceneEntity.rootTransformNode.scaling.scale(defaultScalingModifier);
    }
  }

  private setCombatantSceneEntityPartDefaultMaterials(
    partResult: AssetContainer,
    combatantProperties: CombatantProperties
  ) {
    if (combatantProperties.monsterType === MonsterType.FireMage) {
      for (const mesh of partResult.meshes) {
        if (mesh.material?.name === "Purple") {
          const redMaterial = new StandardMaterial("red", this.scene);
          redMaterial.diffuseColor = new Color3(0.7, 0.2, 0.2);
          mesh.material.dispose();
          mesh.material = redMaterial;
        }
      }
    }

    if (combatantProperties.monsterType === MonsterType.Cultist) {
      for (const mesh of partResult.meshes) {
        if (mesh.material?.name === "Purple") {
          const whiteMaterial = new StandardMaterial("white", this.scene);
          whiteMaterial.diffuseColor = new Color3(0.85, 0.75, 0.75);
          mesh.material.dispose();
          mesh.material = whiteMaterial;
        }
      }
    }
  }
}
