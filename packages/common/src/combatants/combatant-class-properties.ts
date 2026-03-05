import makeAutoObservable from "mobx-store-inheritance";
import { instanceToPlain, plainToInstance } from "class-transformer";
import { COMBATANT_CLASS_NAME_STRINGS, CombatantClass } from "./combatant-class/classes.js";
import { ReactiveNode, Serializable, SerializedOf } from "../serialization/index.js";

export class CombatantClassProperties implements ReactiveNode, Serializable {
  constructor(
    public level: number,
    public combatantClass: CombatantClass
  ) {}

  makeObservable() {
    makeAutoObservable(this);
  }

  toSerialized() {
    return instanceToPlain(this);
  }

  static fromSerialized(serialized: SerializedOf<CombatantClassProperties>) {
    return plainToInstance(CombatantClassProperties, serialized);
  }

  getStringName() {
    return COMBATANT_CLASS_NAME_STRINGS[this.combatantClass];
  }
}
