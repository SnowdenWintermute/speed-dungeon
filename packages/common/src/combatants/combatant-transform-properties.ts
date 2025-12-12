import makeAutoObservable from "mobx-store-inheritance";
import { cloneVector3, runIfInBrowser } from "../utils/index.js";
import { Quaternion, Vector3 } from "@babylonjs/core";
import { plainToInstance } from "class-transformer";
import { CombatantSubsystem } from "./combatant-subsystem.js";
import { EntityId } from "../index.js";

export class CombatantTransformProperties extends CombatantSubsystem {
  public homeRotation: Quaternion = Quaternion.Zero();
  public rotation: Quaternion = Quaternion.Zero();
  private homePosition: Vector3 = Vector3.Zero();
  public position: Vector3 = Vector3.Zero();
  public attachedCombatants = new Set<EntityId>();

  constructor() {
    super();
    runIfInBrowser(() => makeAutoObservable(this));
  }

  static getDeserialized(plain: CombatantTransformProperties) {
    const deserialized = plainToInstance(CombatantTransformProperties, plain);
    deserialized.homePosition = cloneVector3(plain.homePosition);
    deserialized.position = cloneVector3(plain.position);
    deserialized.homeRotation = plainToInstance(Quaternion, plain.homeRotation);
    deserialized.rotation = plainToInstance(Quaternion, plain.rotation);
    return deserialized;
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
      console.log("adding home position transformModifiers for", condition.getStringName());
      const added = transformModifiers.homePosition.add(homePositionModifier);
      transformModifiers.homePosition.copyFrom(added);
    }

    return this.homePosition.add(transformModifiers.homePosition);
  }
}
