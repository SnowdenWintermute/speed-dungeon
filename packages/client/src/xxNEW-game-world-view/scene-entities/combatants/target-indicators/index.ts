import { AbstractMesh, Camera, Mesh, MeshBuilder, Scene, StandardMaterial } from "@babylonjs/core";
import { COMBAT_ACTIONS, CombatActionIntent } from "@speed-dungeon/common";
import { getGameWorldView } from "@/app/game-world-view-canvas/SceneManager";
import { GLOW_LAYER_NAME } from "@/game-world-view/init-scene";
import { TargetIndicator } from "@/mobx-stores/target-indicators";

export class TargetIndicatorBillboardManager {
  indicators: TargetIndicatorBillboard[] = [];
  constructor(
    public cameraOption: null | Camera,
    public targetMesh: AbstractMesh
  ) {}
  synchronizeIndicators(newIndicators: TargetIndicator[]) {
    const existingKeys = new Set(this.indicators.map((i) => i.targetIndicator.getKey()));
    const newKeys = new Set(newIndicators.map((i) => i.getKey()));

    // Remove old ones
    for (let i = this.indicators.length - 1; i >= 0; i--) {
      const billboard = this.indicators[i];
      if (billboard === undefined) throw new Error("unexpected undefined index access");
      if (!newKeys.has(billboard.targetIndicator.getKey())) {
        billboard.cleanup();
        this.indicators.splice(i, 1);
      }
    }

    // Add new ones
    for (const newIndicator of newIndicators) {
      if (!existingKeys.has(newIndicator.getKey())) {
        const billboard = new TargetIndicatorBillboard(newIndicator, getGameWorldView().scene);
        this.indicators.push(billboard);
      }
    }
  }

  updateBillboardPositions() {
    for (const billboard of this.indicators) {
      const camPos = this.cameraOption?.globalPosition;
      if (!camPos) return;
      const boundingInfo = this.targetMesh.getBoundingInfo();
      const dir = camPos.subtract(boundingInfo.boundingBox.centerWorld).normalize();
      billboard.plane.position
        .copyFrom(boundingInfo.boundingBox.centerWorld)
        .addInPlace(dir.scale(boundingInfo.diagonalLength / 2));
    }
  }
}
