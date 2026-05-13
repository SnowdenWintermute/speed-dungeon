import { AbstractMesh, BoundingInfo, Vector3 } from "@babylonjs/core";
import { iterateNumericEnumKeyedRecord } from "@speed-dungeon/common";
import { CombatantSceneEntityModularPartsManager } from "./modular-parts-manager/modular-parts-manager";

export class CombatantSceneEntityBounding {
  constructor(
    private partsManager: CombatantSceneEntityModularPartsManager,
    private rootMesh: AbstractMesh
  ) {}

  get boundingInfo() {
    const boundingInfo = this.rootMesh.getBoundingInfo();
    return boundingInfo;
  }

  updateBox() {
    let minimum: null | Vector3 = null;
    let maximum: null | Vector3 = null;

    for (const [_category, part] of iterateNumericEnumKeyedRecord(this.partsManager.parts)) {
      if (part === null) continue;

      for (const mesh of part.meshes) {
        // Update root mesh bounding box
        mesh.refreshBoundingInfo({ applySkeleton: true, applyMorph: true });
        if (minimum === null) minimum = mesh.getBoundingInfo().minimum;
        if (maximum === null) maximum = mesh.getBoundingInfo().maximum;

        const partMeshBoundingInfo = mesh.getBoundingInfo();

        minimum = Vector3.Minimize(minimum, partMeshBoundingInfo.minimum);
        maximum = Vector3.Maximize(maximum, partMeshBoundingInfo.maximum);
      }
    }

    if (minimum === null || maximum === null) {
      return console.error("no mesh bounding info found");
    }

    this.rootMesh.setBoundingInfo(
      new BoundingInfo(minimum, maximum, this.rootMesh.getWorldMatrix())
    );
  }
}
