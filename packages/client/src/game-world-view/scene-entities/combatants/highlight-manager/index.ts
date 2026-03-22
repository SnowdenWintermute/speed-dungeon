import { AbstractMesh, Color3, PBRMaterial, Scene, StandardMaterial } from "@babylonjs/core";
import { NormalizedPercentage, iterateNumericEnumKeyedRecord } from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";
import { CharacterModelPartCategory } from "../modular-parts-manager/modular-parts";
import { CombatantSceneEntity } from "..";
import { ClientApplication } from "@/client-application";
import { TurnIndicator } from "./turn-indicator";

export class HighlightManager {
  private originalPartMaterialColors: Partial<
    Record<CharacterModelPartCategory, { [meshName: string]: Color3 }>
  > = {};
  private originalEquipmentMaterialColors: {
    [equipmentId: string]: { [meshName: string]: Color3 };
  } = {};
  public turnIndicator: null | TurnIndicator = null;
  public isHighlighted: boolean = false;
  private isDirty = false;

  constructor(
    private scene: Scene,
    private clientApplication: ClientApplication,
    private sceneEntity: CombatantSceneEntity
  ) {
    makeAutoObservable(this);
  }

  private materialHiglightable(material: any): material is StandardMaterial | PBRMaterial {
    return material instanceof StandardMaterial || material instanceof PBRMaterial;
  }

  setHighlighted() {
    for (const [partCategory, part] of iterateNumericEnumKeyedRecord(
      this.sceneEntity.modularPartsManager.parts
    )) {
      if (!part) {
        continue;
      }

      const originalColors: { [meshName: string]: Color3 } = {};

      for (const mesh of part.meshes) {
        const { material } = mesh;
        if (!this.materialHiglightable(material)) {
          continue;
        }
        const originalColor = material.emissiveColor.clone();
        originalColors[mesh.name] = originalColor;
      }

      this.originalPartMaterialColors[partCategory] = originalColors;
    }

    for (const equipmentModel of this.sceneEntity.equipmentManager.getAllModels()) {
      const originalColors: { [meshName: string]: Color3 } = {};

      for (const mesh of equipmentModel.assetContainer.meshes) {
        const { material } = mesh;
        if (!(material instanceof StandardMaterial) && !(material instanceof PBRMaterial)) {
          continue;
        }
        const originalColor = material.emissiveColor.clone();
        originalColors[mesh.name] = originalColor;
      }

      this.originalEquipmentMaterialColors[equipmentModel.entityId] = originalColors;
    }

    this.isHighlighted = true;

    this.turnIndicator = new TurnIndicator(this.scene);
    this.turnIndicator.attachToCombatantEntity(this.sceneEntity);
  }

  removeHighlight() {
    for (const [partCategory, part] of iterateNumericEnumKeyedRecord(
      this.sceneEntity.modularPartsManager.parts
    )) {
      if (!part) continue;

      const originalColors = this.originalPartMaterialColors[partCategory];
      if (!originalColors) {
        continue;
      }

      for (const mesh of part.meshes) {
        const { material } = mesh;
        if (!this.materialHiglightable(material)) {
          continue;
        }
        const originalColorOption = originalColors[mesh.name];
        if (originalColorOption) material.emissiveColor = originalColorOption;
      }
      delete this.originalPartMaterialColors[partCategory];
    }

    for (const equipmentModel of this.sceneEntity.equipmentManager.getAllModels()) {
      const originalColors = this.originalEquipmentMaterialColors[equipmentModel.entityId];
      if (!originalColors) {
        // console.info("original colors not found when removing highlight");
        continue;
      }
      for (const mesh of equipmentModel.assetContainer.meshes) {
        const { material } = mesh;
        if (!this.materialHiglightable(material)) {
          continue;
        }
        const originalColorOption = originalColors[mesh.name];
        if (originalColorOption) material.emissiveColor = originalColorOption;
      }

      delete this.originalEquipmentMaterialColors[equipmentModel.entityId];
    }

    this.isHighlighted = false;

    if (this.turnIndicator) {
      this.turnIndicator.dispose();
    }
  }

  updateHighlight() {
    if (this.isDirty) {
      // @TODO - check if this still matters now that we changed combatants to have a ref stored on their scene entities
      // if we tame a pet and they are the last pet in the battle, we'll remove them from the battle before
      // removing their 3d model since it is playing the onTamed animation with an onComplete function that
      // synchronizes the combatant models to the game state. During that time, we're trying to call updateHighlight
      // on every model that still exists, including the pet's model which no longer maps to a combatant
      // which will cause an error, therefore we'll mark it dirty on the first error so we don't keep trying
      // to get the combatant on the ticks before the model is synchronized
      return;
    }

    const { gameContext } = this.clientApplication;

    const { partyOption } = gameContext;
    if (partyOption !== undefined) {
      const { gameOption } = gameContext;
      if (gameOption === null) return;
      const battleOption = partyOption.getBattleOption(gameOption);
      if (battleOption === null) {
        this.removeHighlight();
        return;
      }

      try {
        const isMonster =
          this.sceneEntity.combatant.combatantProperties.controlledBy.isDungeonControlled();
        if (isMonster) {
          return;
        }

        const entityId = this.sceneEntity.combatant.getEntityId();

        const fastestActorId = battleOption.turnOrderManager
          .getFastestActorTurnOrderTracker()
          .getEntityId();
        const isTurn = fastestActorId === entityId;

        const inputIsLocked = partyOption ? partyOption.inputLock.isLocked() : false;

        const { targetIndicatorStore } = this.clientApplication;
        const isSelectingActionTargets = targetIndicatorStore.userHasTargets(entityId);

        // if (indicators.length && !this.isHighlighted) {
        if (isTurn && !this.isHighlighted && !inputIsLocked && !isSelectingActionTargets) {
          this.setHighlighted();
          // } else if (this.isHighlighted && !indicators.length) {
        } else if ((this.isHighlighted && !isTurn) || inputIsLocked || isSelectingActionTargets) {
          this.removeHighlight();
        }
      } catch (error) {
        console.info("highlighter error", error);
        this.isDirty = true;
        this.removeHighlight();
      }
    }

    if (!this.isHighlighted) return;

    // spin and pulse the targetingIndicator
    const isFocused = this.clientApplication.combatantFocus.characterIsFocused(
      this.sceneEntity.combatant.getEntityId()
    );
    const pulseEffectParameters = this.getRotationParameters();
    this.turnIndicator?.update(pulseEffectParameters, isFocused);

    // glow the character and their equipment
    const { scale } = pulseEffectParameters;
    for (const [_partCategory, part] of iterateNumericEnumKeyedRecord(
      this.sceneEntity.modularPartsManager.parts
    )) {
      if (!part) continue;

      for (const mesh of part.meshes) {
        this.scaleMaterialBaseColor(mesh, scale);
      }
    }

    for (const equipmentModel of this.sceneEntity.equipmentManager.getAllModels()) {
      for (const mesh of equipmentModel.assetContainer.meshes) {
        this.scaleMaterialBaseColor(mesh, 0.5 * scale);
      }
    }
  }

  private scaleMaterialBaseColor(mesh: AbstractMesh, scale: NormalizedPercentage) {
    const { material } = mesh;
    if (!this.materialHiglightable(material)) return;
    const baseColor =
      material instanceof PBRMaterial ? material.albedoColor : material.diffuseColor;
    const scaled = baseColor.scale(scale);
    material.emissiveColor.copyFrom(scaled);
  }

  private getRotationParameters(): PulseEffectParameters {
    const base = 0.05;
    const amplitude = 0.15;
    const frequency = 0.3;
    const elapsed = Date.now() / 1000;
    const scale = base + amplitude + amplitude * Math.sin(2 * Math.PI * frequency * elapsed);

    const normalized = (scale - base) / (2 * amplitude);

    return { elapsed, scale, normalized };
  }

  showDebug() {
    this.turnIndicator?.showDebug();
  }

  hideDebug() {
    this.turnIndicator?.hideDebug();
  }
}

export interface PulseEffectParameters {
  elapsed: number;
  scale: number;
  normalized: NormalizedPercentage;
}
