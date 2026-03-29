import { Quaternion, TransformNode, Vector3 } from "@babylonjs/core";
import { Combatant } from "@speed-dungeon/common";

export class CombatantSceneEntityPositionControls {
  constructor(
    private combatant: Combatant,
    private rootTransformNode: TransformNode
  ) {}

  setHomeRotation(rotation: Quaternion) {
    this.combatant.combatantProperties.transformProperties.setHomeRotation(rotation);
  }

  setHomePosition(position: Vector3) {
    this.combatant.combatantProperties.transformProperties.setHomePosition(position);
  }

  setRotation(rotation: Quaternion) {
    if (this.rootTransformNode.rotationQuaternion) {
      this.rootTransformNode.rotationQuaternion.copyFrom(rotation);
    } else {
      this.rootTransformNode.rotationQuaternion = rotation.clone();
    }
  }

  setPosition(position: Vector3) {
    this.rootTransformNode.position.copyFrom(position);
  }
}
