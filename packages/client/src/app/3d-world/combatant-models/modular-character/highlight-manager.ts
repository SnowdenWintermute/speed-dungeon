import { Color3, PBRMaterial, StandardMaterial } from "@babylonjs/core";
import { ModularCharacter } from ".";
import { iterateNumericEnumKeyedRecord } from "@speed-dungeon/common";
import { ModularCharacterPartCategory } from "./modular-character-parts";
import cloneDeep from "lodash.clonedeep";

export class HighlightManager {
  private originalPartMaterialColors: Partial<
    Record<ModularCharacterPartCategory, { [meshName: string]: Color3 }>
  > = {};
  private originalEquipmentMaterialColors: {
    [equipmentId: string]: { [meshName: string]: Color3 };
  } = {};
  public isHighlighted: boolean = false;
  constructor(private modularCharacter: ModularCharacter) {}

  setHighlighted() {
    for (const [partCategory, part] of iterateNumericEnumKeyedRecord(this.modularCharacter.parts)) {
      if (!part) continue;

      const originalColors: { [meshName: string]: Color3 } = {};

      for (const mesh of part.meshes) {
        const { material } = mesh;
        if (!(material instanceof StandardMaterial) && !(material instanceof PBRMaterial)) continue;
        const originalColor = cloneDeep(material.emissiveColor);
        originalColors[mesh.name] = originalColor;
      }

      this.originalPartMaterialColors[partCategory] = originalColors;
    }

    for (const [equipmentId, equipmentModel] of Object.entries(
      this.modularCharacter.equipment.holdables
    )) {
      const originalColors: { [meshName: string]: Color3 } = {};

      for (const mesh of equipmentModel.meshes) {
        const { material } = mesh;
        if (!(material instanceof StandardMaterial) && !(material instanceof PBRMaterial)) continue;
        const originalColor = cloneDeep(material.emissiveColor);
        originalColors[mesh.name] = originalColor;
      }

      this.originalEquipmentMaterialColors[equipmentId] = originalColors;
    }

    this.isHighlighted = true;
  }

  removeHighlight() {
    for (const [partCategory, part] of iterateNumericEnumKeyedRecord(this.modularCharacter.parts)) {
      if (!part) continue;

      const originalColors = this.originalPartMaterialColors[partCategory];
      if (!originalColors) {
        console.error("original colors not found when removing highlight");
        continue;
      }

      for (const mesh of part.meshes) {
        const { material } = mesh;
        if (!(material instanceof StandardMaterial) && !(material instanceof PBRMaterial)) continue;
        const originalColorOption = originalColors[mesh.name];
        if (originalColorOption) material.emissiveColor = originalColorOption;
      }
      delete this.originalPartMaterialColors[partCategory];
    }

    for (const [equipmentId, equipmentModel] of Object.entries(
      this.modularCharacter.equipment.holdables
    )) {
      const originalColors = this.originalEquipmentMaterialColors[equipmentId];
      if (!originalColors) {
        console.error("original colors not found when removing highlight");
        continue;
      }
      for (const mesh of equipmentModel.meshes) {
        const { material } = mesh;
        if (!(material instanceof StandardMaterial) && !(material instanceof PBRMaterial)) continue;
        const originalColorOption = originalColors[mesh.name];
        if (originalColorOption) material.emissiveColor = originalColorOption;
      }

      delete this.originalEquipmentMaterialColors[equipmentId];
    }

    this.isHighlighted = false;
  }

  updateHighlight() {
    if (!this.isHighlighted) return;

    const base = 0.05;
    const amplitude = 0.15;
    const frequency = 0.3;
    const elapsed = Date.now() / 1000;
    const scale = base + amplitude + amplitude * Math.sin(2 * Math.PI * frequency * elapsed);

    for (const [_partCategory, part] of iterateNumericEnumKeyedRecord(
      this.modularCharacter.parts
    )) {
      if (!part) continue;

      for (const mesh of part.meshes) {
        const { material } = mesh;

        if (material instanceof StandardMaterial || material instanceof PBRMaterial) {
          const baseColor =
            material instanceof PBRMaterial ? material.albedoColor : material.diffuseColor;
          material.emissiveColor.r = baseColor.r * scale;
          material.emissiveColor.g = baseColor.g * scale;
          material.emissiveColor.b = baseColor.b * scale;
        }
      }
    }

    for (const [_entityId, equipmentModel] of Object.entries(
      this.modularCharacter.equipment.holdables
    )) {
      for (const mesh of equipmentModel.meshes) {
        const { material } = mesh;

        if (material instanceof StandardMaterial || material instanceof PBRMaterial) {
          const baseColor =
            material instanceof PBRMaterial ? material.albedoColor : material.diffuseColor;
          material.emissiveColor.r = baseColor.r * scale * 0.5;
          material.emissiveColor.g = baseColor.g * scale * 0.5;
          material.emissiveColor.b = baseColor.b * scale * 0.5;
        }
      }
    }
  }
}
