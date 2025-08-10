import {
  AbstractMesh,
  BoundingInfo,
  Camera,
  DynamicTexture,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
} from "@babylonjs/core";
import {
  COMBAT_ACTIONS,
  CombatActionIntent,
  CombatActionName,
  EntityId,
  Meters,
} from "@speed-dungeon/common";
import { getGameWorld } from "../../SceneManager";
import { CharacterModel } from ".";
import { GLOW_LAYER_NAME } from "../../game-world/init-scene";

export class TargetIndicator {
  constructor(
    public targetedBy: EntityId,
    public targetId: EntityId,
    public actionName: CombatActionName
  ) {}

  getKey() {
    return this.targetedBy + this.targetId;
  }
}

export class TargetIndicatorBillboard {
  plane: Mesh;
  constructor(
    public readonly targetIndicator: TargetIndicator,
    scene: Scene
  ) {
    this.plane = MeshBuilder.CreatePlane("billboard", { size: 0.25 }, scene);
    this.plane.billboardMode = Mesh.BILLBOARDMODE_ALL;
    // Optional: ensure it's not affected by scene lighting
    const mat = new StandardMaterial("billboardMat", scene);
    mat.diffuseTexture = getGameWorld().targetIndicatorTexture;

    const action = COMBAT_ACTIONS[this.targetIndicator.actionName];
    switch (action.targetingProperties.intent) {
      case CombatActionIntent.Benevolent:
        mat.emissiveColor.set(0, 1, 0);
        break;
      case CombatActionIntent.Malicious:
        mat.emissiveColor.set(1, 0, 0);
        break;
    }

    this.plane.material = mat;

    getGameWorld().scene.getGlowLayerByName(GLOW_LAYER_NAME)?.addExcludedMesh(this.plane);
  }

  cleanup() {
    this.plane.dispose();
  }
}

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
        const billboard = new TargetIndicatorBillboard(newIndicator, getGameWorld().scene);
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
