import { AbstractMesh, DynamicTexture } from "@babylonjs/core";
import { TargetIndicatorBillboard } from "./target-indicator-billboard";
import { GameWorldView } from "@/game-world-view";
import { TargetIndicator } from "@/client-application/target-indicator-store";

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
    gameWorldView.textureManager.fillDynamicTextureWithSvg(targetImageUrl, this.texture, {
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
          this.texture,
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
