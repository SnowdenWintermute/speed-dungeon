import { Quaternion, TransformNode, Vector3 } from "@babylonjs/core";
import { CombatantSceneEntity } from ".";

export class CombatantSceneEntityPositionControls {
  constructor(
    private parent: CombatantSceneEntity,
    private rootTransformNode: TransformNode
  ) {}

  setHomeRotation(rotation: Quaternion) {
    this.parent.combatant.combatantProperties.transformProperties.setHomeRotation(rotation);
  }

  setHomePosition(position: Vector3) {
    this.parent.combatant.combatantProperties.transformProperties.setHomePosition(position);
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
