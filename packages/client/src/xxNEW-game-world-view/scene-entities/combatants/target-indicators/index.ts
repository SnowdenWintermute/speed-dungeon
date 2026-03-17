import { AbstractMesh, DynamicTexture } from "@babylonjs/core";
import { TargetIndicator } from "@/mobx-stores/target-indicators";
import { TargetIndicatorBillboard } from "./target-indicator-billboard";
import { GameWorldView } from "@/xxNEW-game-world-view";
import { fillDynamicTextureWithSvg } from "@/utils";

export class TargetIndicatorBillboardManager {
  private indicators: TargetIndicatorBillboard[] = [];
  private texture: DynamicTexture;

  constructor(
    private gameWorldView: GameWorldView,
    private targetMesh: AbstractMesh
  ) {
    this.texture = new DynamicTexture(
      "target indicator texture",
      256,
      this.gameWorldView.scene,
      false
    );
    this.texture.hasAlpha = true;

    const targetImageUrl = "/img/game-ui-icons/target-icon.svg";
    fillDynamicTextureWithSvg(targetImageUrl, this.texture, {
      strokeColor: "white",
      fillColor: "white",
    });
  }

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
        const billboard = new TargetIndicatorBillboard(
          this.gameWorldView.scene,
          this.gameWorldView.targetIndicatorTexture,
          newIndicator
        );
        this.indicators.push(billboard);
      }
    }
  }

  updateBillboardPositions() {
    for (const billboard of this.indicators) {
      const cameraPosition = this.gameWorldView.camera?.globalPosition;
      if (!cameraPosition) return;
      billboard.updatePosition(this.targetMesh, cameraPosition);
    }
  }
}
