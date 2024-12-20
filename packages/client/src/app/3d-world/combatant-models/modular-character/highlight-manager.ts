import {
  Color3,
  MultiMaterial,
  PBRMaterial,
  ShaderMaterial,
  StandardMaterial,
} from "@babylonjs/core";
import { ModularCharacter } from ".";
import { iterateNumericEnumKeyedRecord } from "@speed-dungeon/common";
import { ModularCharacterPartCategory } from "./modular-character-parts";
import cloneDeep from "lodash.clonedeep";

export class HighlightManager {
  private value: number = 0.0;
  private direction: number = 0;
  private originalPartMaterialColors: Partial<
    Record<ModularCharacterPartCategory, { [meshName: string]: Color3 }>
  > = {};
  public isHighlighted: boolean = false;
  constructor(private modularCharacter: ModularCharacter) {}

  // save original diffuse colors by material
  // update on pulsing wave function
  // return to original colors
  //
  setHighlighted() {
    for (const [partCategory, part] of iterateNumericEnumKeyedRecord(this.modularCharacter.parts)) {
      if (!part) continue;

      const originalColors: { [meshName: string]: Color3 } = {};

      for (const mesh of part.meshes) {
        const { material } = mesh;
        if (material instanceof StandardMaterial) console.log("StandardMaterial");
        if (material instanceof PBRMaterial) console.log("PBRMaterial");
        if (material instanceof MultiMaterial) console.log("MultiMaterial");
        if (material instanceof ShaderMaterial) console.log("ShaderMaterial");
        if (!(material instanceof StandardMaterial) && !(material instanceof PBRMaterial)) {
          console.log("this material is not colorable");
          continue;
        }

        const originalColor = cloneDeep(material.emissiveColor);

        originalColors[mesh.name] = originalColor;
        console.log("saved mesh name ", mesh.name, "original color", originalColor);
      }

      this.originalPartMaterialColors[partCategory] = originalColors;
      console.log("saved original colors: ", originalColors);
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

    this.isHighlighted = false;

    console.log("removed highlighted:", this.modularCharacter.entityId);
  }

  updateHighlight() {
    if (!this.isHighlighted) return;

    const scale = this.value;
    if (scale > 0.8 && this.direction === 1) {
      this.direction = 0;
    } else if (scale < 0.1 && this.direction === 0) this.direction = 1;

    if (this.direction === 0) this.value -= 0.005;
    if (this.direction === 1) this.value += 0.005;

    for (const [partCategory, part] of iterateNumericEnumKeyedRecord(this.modularCharacter.parts)) {
      if (!part) continue;

      for (const mesh of part.meshes) {
        const { material } = mesh;

        if (material instanceof StandardMaterial || material instanceof PBRMaterial) {
          const baseColor =
            material instanceof PBRMaterial ? material.albedoColor : material.diffuseColor;
          material.emissiveColor.r = baseColor.r * this.value;
          material.emissiveColor.g = baseColor.g * this.value;
          material.emissiveColor.b = baseColor.b * this.value;
          // mesh.material.emissiveColor = new Color3(0, 0, 0);
        }
      }
    }

    // for (const equipment of Object.values(this.modularCharacter.equipment.holdables)) {
    //   for (const mesh of equipment.meshes)
    //     if (mesh.material instanceof StandardMaterial) {
    //       mesh.material.emissiveColor = mesh.material.diffuseColor.scale(this.value);
    //       // mesh.material.emissiveColor = new Color3(0, 0, 0);
    //     }
    // }
  }
}
