import { TargetIndicator } from "@/client-application/target-indicator-store";
import { GLOW_LAYER_NAME } from "@/xxNEW-game-world-view/scene-setup";
import { Mesh, MeshBuilder, Scene, StandardMaterial } from "@babylonjs/core";
import { COMBAT_ACTIONS, CombatActionIntent } from "@speed-dungeon/common";

export class TargetIndicatorBillboard {
  private plane: Mesh;
  private material: StandardMaterial;
  constructor(
    public readonly targetIndicator: TargetIndicator,
    scene: Scene
  ) {
    const name = `target-indicator-[${targetIndicator.targetId}]`;
    this.plane = MeshBuilder.CreatePlane(name, { size: 0.25 }, scene);
    this.plane.billboardMode = Mesh.BILLBOARDMODE_ALL;
    // Optional: ensure it's not affected by scene lighting
    this.material = new StandardMaterial(`${name}-material`, scene);
    this.material.diffuseTexture = getGameWorldView().targetIndicatorTexture;
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

  cleanup() {
    this.plane.dispose(false);
    this.material.dispose();
  }
}
