import { Exclude, instanceToPlain, plainToInstance } from "class-transformer";
import { makeAutoObservable } from "mobx";
import { CombatAttribute, initializeCombatAttributeRecord } from "./attributes/index.js";
import { addAttributesToAccumulator } from "./attributes/add-attributes-to-accumulator.js";
import { CombatantProperties } from "./combatant-properties.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { runIfInBrowser } from "../utils/index.js";

export type CombatantAttributeRecord = Partial<Record<CombatAttribute, number>>;

export class CombatantAttributeProperties {
  private inherentAttributes: CombatantAttributeRecord = {};
  private speccedAttributes: CombatantAttributeRecord = {};
  private unspentAttributePoints: number = 0;

  @Exclude() // don't send parent references over the wire
  private combatantProperties: CombatantProperties | undefined;

  constructor() {
    runIfInBrowser(() => makeAutoObservable(this, {}, { autoBind: true }));
  }

  initialize(combatantProperties: CombatantProperties) {
    console.log("initialized attributeProperties");
    this.combatantProperties = combatantProperties;
  }

  private getCombatantProperties() {
    if (this.combatantProperties === undefined) {
      throw new Error(ERROR_MESSAGES.CLASS_INSTANCE_NOT_INITIALIZED);
    }
    return this.combatantProperties;
  }

  static getDeserialized(serialized: CombatantAttributeProperties) {
    const deserialized = plainToInstance(CombatantAttributeProperties, serialized);
    return deserialized;
  }

  incrementAttribute(attribute: CombatAttribute) {
    if (this.speccedAttributes[attribute] === undefined) this.speccedAttributes[attribute] = 0;
    else this.speccedAttributes[attribute] += 1;

    const combatantProperties = this.getCombatantProperties();
    console.log(
      "very circular mana:",
      combatantProperties.attributeProperties
        .getCombatantProperties()
        .attributeProperties.getCombatantProperties().mana
    );
  }

  setInherentAttributeValue(attribute: CombatAttribute, value: number) {
    this.inherentAttributes[attribute] = value;
  }

  changeUnspentPoints(value: number) {
    this.unspentAttributePoints += value;
  }

  getUnspentPoints() {
    return this.unspentAttributePoints;
  }

  getNaturalAttributes() {
    const total = initializeCombatAttributeRecord();
    addAttributesToAccumulator(this.inherentAttributes, total);
    addAttributesToAccumulator(this.speccedAttributes, total);
    return total;
  }
}
