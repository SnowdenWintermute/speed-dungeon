import { TargetIndicator } from "@/client-application/target-indicator-store";
import { GLOW_LAYER_NAME } from "@/game-world-view/game-world-view-consts";
import {
  AbstractMesh,
  DynamicTexture,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import { COMBAT_ACTIONS, CombatActionIntent } from "@speed-dungeon/common";

export class TargetIndicatorBillboard {
  private plane: Mesh;
  private material: StandardMaterial;
  constructor(
    scene: Scene,
    texture: DynamicTexture,
    public readonly targetIndicator: TargetIndicator
  ) {
    const name = `target-indicator-[${targetIndicator.targetId}]`;
    this.plane = MeshBuilder.CreatePlane(name, { size: 0.25 }, scene);
    this.plane.billboardMode = Mesh.BILLBOARDMODE_ALL;
    // Optional: ensure it's not affected by scene lighting
    this.material = new StandardMaterial(`${name}-material`, scene);
    this.material.diffuseTexture = texture;
    const mat = this.material;

    const action = COMBAT_ACTIONS[this.targetIndicator.actionName];
    switch (action.targetingProperties.intent) {
      case CombatActionIntent.Benevolent:
        {
          mat.emissiveColor.set(0, 1, 0);
          mat.diffuseColor.set(0, 1, 0);
        }
        break;
      case CombatActionIntent.Malicious:
        {
          mat.emissiveColor.set(1, 0, 0);
          mat.diffuseColor.set(1, 0, 0);
        }
        break;
    }

    this.plane.material = mat;

    scene.getGlowLayerByName(GLOW_LAYER_NAME)?.addExcludedMesh(this.plane);
  }

  updatePosition(targetMesh: AbstractMesh, cameraPosition: Vector3) {
    const boundingInfo = targetMesh.getBoundingInfo();
    const dir = cameraPosition.subtract(boundingInfo.boundingBox.centerWorld).normalize();
    this.plane.position
      .copyFrom(boundingInfo.boundingBox.centerWorld)
      .addInPlace(dir.scale(boundingInfo.diagonalLength / 2));
  }

  cleanup() {
    this.plane.dispose(false);
    this.material.dispose();
  }
}
