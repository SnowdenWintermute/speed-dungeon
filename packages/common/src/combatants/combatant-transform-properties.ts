import makeAutoObservable from "mobx-store-inheritance";
import { cloneVector3, runIfInBrowser } from "../utils/index.js";
import { Quaternion, Vector3 } from "@babylonjs/core";
import { plainToInstance } from "class-transformer";

export class CombatantTransformProperties {
  public homeRotation: Quaternion = Quaternion.Zero();
  public rotation: Quaternion = Quaternion.Zero();
  public homePosition: Vector3 = Vector3.Zero();
  public position: Vector3 = Vector3.Zero();

  constructor() {
    runIfInBrowser(() => makeAutoObservable(this, {}, { autoBind: true }));
  }

  static getDeserialized(plain: CombatantTransformProperties) {
    const deserialized = plainToInstance(CombatantTransformProperties, plain);
    deserialized.homePosition = cloneVector3(plain.homePosition);
    deserialized.position = cloneVector3(plain.position);
    return deserialized;
  }
}
