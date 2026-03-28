import { Quaternion, Vector3 } from "@babylonjs/core";
import { CombatantSubsystem } from "./combatant-subsystem.js";
import { EntityId, NormalizedPercentage } from "../index.js";
import { Serializable, SerializedOf } from "../serialization/index.js";
import { SetUtils } from "../utils/set-utils.js";

export class CombatantTransformProperties extends CombatantSubsystem implements Serializable {
  public homeRotation: Quaternion = Quaternion.Zero();
  public rotation: Quaternion = Quaternion.Zero();
  private homePosition: Vector3 = Vector3.Zero();
  public position: Vector3 = Vector3.Zero();
  public attachedCombatants = new Set<EntityId>();
  public scaleModifier?: NormalizedPercentage;

  toSerialized() {
    const result = {
      homeRotation: this.homeRotation.asArray(),
      rotation: this.rotation.asArray(),
      homePosition: this.homePosition.asArray(),
      position: this.position.asArray(),
      attachedCombatants: SetUtils.serializeShallow(this.attachedCombatants),
      scaleModifier: this.scaleModifier,
    };

    if (this.scaleModifier === undefined) {
      delete result.scaleModifier;
    }
    return result;
  }

  static fromSerialized(serialized: SerializedOf<CombatantTransformProperties>) {
    const result = new CombatantTransformProperties();
    result.homeRotation = Quaternion.FromArray(serialized.homeRotation);
    result.rotation = Quaternion.FromArray(serialized.rotation);
    result.homePosition = Vector3.FromArray(serialized.homePosition);
    result.position = Vector3.FromArray(serialized.position);
    result.attachedCombatants = SetUtils.deserializeShallow(serialized.attachedCombatants);
    result.scaleModifier = serialized.scaleModifier;

    return result;
  }

  setAttachedCombatant(entityId: EntityId) {
    this.attachedCombatants.add(entityId);
  }

  removeAttachedCombatant(entityId: EntityId) {
    this.attachedCombatants.delete(entityId);
  }

  setToHomeTransform() {
    this.position.copyFrom(this.getHomePosition());
    this.rotation.copyFrom(this.homeRotation);
  }

  setHomePosition(newHomePosition: Vector3) {
    this.homePosition.copyFrom(newHomePosition);
  }

  setHomeRotation(newHomeRotation: Quaternion) {
    this.homeRotation.copyFrom(newHomeRotation);
  }

  getHomePosition() {
    const transformModifiers = {
      homePosition: new Vector3(),
    };

    const conditions = this.getCombatantProperties().conditionManager.getConditions();

    for (const condition of conditions) {
      const homePositionModifier = condition.getTransformModifiers().homePosition;
      if (!homePositionModifier) {
        continue;
      }
      const added = transformModifiers.homePosition.add(homePositionModifier);
      transformModifiers.homePosition.copyFrom(added);
    }

    return this.homePosition.add(transformModifiers.homePosition);
  }
}
