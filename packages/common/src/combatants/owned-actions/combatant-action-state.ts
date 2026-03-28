import { instanceToPlain, plainToInstance } from "class-transformer";
import { CombatActionName } from "../../combat/combat-actions/combat-action-names.js";
import { MaxAndCurrent } from "../../primatives/max-and-current.js";
import { ReactiveNode, Serializable, SerializedOf } from "../../serialization/index.js";
import { makeAutoObservable } from "mobx";

export class CombatantActionState implements Serializable, ReactiveNode {
  wasUsedThisTurn: boolean = false;
  constructor(
    public actionName: CombatActionName,
    public level = 1,
    public cooldown: null | MaxAndCurrent = null
  ) {}

  makeObservable() {
    makeAutoObservable(this);
  }

  toSerialized() {
    return instanceToPlain(this);
  }

  static fromSerialized(serialized: SerializedOf<CombatantActionState>) {
    return plainToInstance(CombatantActionState, serialized);
  }
}
