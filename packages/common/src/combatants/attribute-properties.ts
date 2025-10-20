import { plainToInstance } from "class-transformer";
import { makeAutoObservable } from "mobx";
import { CombatAttribute } from "./attributes/index.js";

export type CombatantAttributeRecord = Partial<Record<CombatAttribute, number>>;

export class CombatantAttributeProperties {
  private inherentAttributes: CombatantAttributeRecord = {};
  private speccedAttributes: CombatantAttributeRecord = {};
  private unspentAttributePoints: number = 0;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  static getDeserialized(serialized: CombatantAttributeProperties) {
    return plainToInstance(CombatantAttributeProperties, serialized);
  }

  incrementAttribute(attribute: CombatAttribute) {
    if (this.speccedAttributes[attribute] === undefined) this.speccedAttributes[attribute] = 0;
    else this.speccedAttributes[attribute] += 1;
  }

  changeUnspentPoints(value: number) {
    this.unspentAttributePoints += value;
  }

  getUnspentPoints() {
    return this.unspentAttributePoints;
  }
}
