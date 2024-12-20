import { PBRMaterial, StandardMaterial } from "@babylonjs/core";
import { ModularCharacter } from ".";

export class HighlightManager {
  private value: number = 0.0;
  private direction: number = 0;
  constructor(private modularCharacter: ModularCharacter) {}

  // save original diffuse colors by material
  // update on pulsing wave function
  // return to original colors

  updateHighlight() {
    const scale = this.value;
    if (scale > 0.4 && this.direction === 1) {
      this.direction = 0;
    } else if (scale < 0.1 && this.direction === 0) this.direction = 1;

    if (this.direction === 0) this.value -= 0.8;
    if (this.direction === 1) this.value += 0.8;

    for (const part of Object.values(this.modularCharacter.parts)) {
      if (!part) continue;

      for (const mesh of part.meshes) {
        const { material } = mesh;
        console.log("part material: ", mesh.material);

        if (material instanceof StandardMaterial || material instanceof PBRMaterial) {
          const originalColor =
            material instanceof PBRMaterial ? material.albedoColor : material.diffuseColor;
          material.emissiveColor = originalColor.scale(this.value);
          // mesh.material.emissiveColor = new Color3(0, 0, 0);
        }
      }
    }

    for (const equipment of Object.values(this.modularCharacter.equipment.holdables)) {
      for (const mesh of equipment.meshes)
        if (mesh.material instanceof StandardMaterial) {
          mesh.material.emissiveColor = mesh.material.diffuseColor.scale(this.value);
          // mesh.material.emissiveColor = new Color3(0, 0, 0);
        }
    }
  }
}
