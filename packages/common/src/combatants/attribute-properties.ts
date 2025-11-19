import makeAutoObservable from "mobx-store-inheritance";
import { plainToInstance } from "class-transformer";
import { CombatAttribute } from "./attributes/index.js";
import { addAttributesToAccumulator } from "./attributes/add-attributes-to-accumulator.js";
import { iterateNumericEnumKeyedRecord, runIfInBrowser } from "../utils/index.js";
import { getCombatantTotalAttributes } from "./attributes/get-combatant-total-attributes.js";
import { Item } from "../items/index.js";
import { CombatantSubsystem } from "./combatant-subsystem.js";
import { initializeCombatAttributeRecord } from "./attributes/initialize-combat-attribute-record.js";

export type CombatantAttributeRecord = Partial<Record<CombatAttribute, number>>;

export class CombatantAttributeProperties extends CombatantSubsystem {
  private inherentAttributes: CombatantAttributeRecord = {};
  private speccedAttributes: CombatantAttributeRecord = {};
  private unspentAttributePoints: number = 0;

  constructor() {
    super();
    runIfInBrowser(() => makeAutoObservable(this));
  }

  static getDeserialized(serialized: CombatantAttributeProperties) {
    const deserialized = plainToInstance(CombatantAttributeProperties, serialized);
    return deserialized;
  }

  allocatePoint(attribute: CombatAttribute) {
    this.getCombatantProperties().resources.maintainResourcePercentagesAfterEffect(() => {
      const currentAttributeValue = this.speccedAttributes[attribute] || 0;
      this.speccedAttributes[attribute] = currentAttributeValue + 1;
      this.unspentAttributePoints -= 1;
    });
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

  getTotalAttributes = () => getCombatantTotalAttributes(this.getCombatantProperties());

  getAttributeValue(attribute: CombatAttribute) {
    return this.getTotalAttributes()[attribute];
  }

  getUnmetItemRequirements(item: Item) {
    const totalAttributes = this.getTotalAttributes();

    const unmetAttributeRequirements: Set<CombatAttribute> = new Set();
    for (const [attribute, value] of iterateNumericEnumKeyedRecord(item.requirements)) {
      const characterAttribute = totalAttributes[attribute] || 0;
      if (characterAttribute >= value) continue;
      else unmetAttributeRequirements.add(attribute);
    }

    return unmetAttributeRequirements;
  }

  hasRequiredAttributesToUseItem(item: Item): boolean {
    const requirementsMet = Item.requirementsMet(item, this.getTotalAttributes());
    if (!requirementsMet) return false;
    return true;
  }
}
