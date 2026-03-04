import makeAutoObservable from "mobx-store-inheritance";
import { plainToInstance, serialize } from "class-transformer";
import { ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES, CombatAttribute } from "./attributes/index.js";
import { addAttributesToAccumulator } from "./attributes/add-attributes-to-accumulator.js";
import { iterateNumericEnumKeyedRecord } from "../utils/index.js";
import { getCombatantTotalAttributes } from "./attributes/get-combatant-total-attributes.js";
import { Item } from "../items/index.js";
import { CombatantSubsystem } from "./combatant-subsystem.js";
import { initializeCombatAttributeRecord } from "./attributes/initialize-combat-attribute-record.js";
import { CombatantAttributeRecord } from "./combatant-attribute-record.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { ReactiveNode, Serializable } from "../serialization/index.js";

export class CombatantAttributeProperties
  extends CombatantSubsystem
  implements ReactiveNode, Serializable
{
  private inherentAttributes: CombatantAttributeRecord = {};
  private speccedAttributes: CombatantAttributeRecord = {};
  private unspentAttributePoints: number = 0;

  getSerialized() {
    return {
      inherentAttributes: this.inherentAttributes,
      speccedAttributes: this.speccedAttributes,
      unspentAttributePoints: this.unspentAttributePoints,
    };
  }

  makeObservable(): void {
    makeAutoObservable(this);
  }

  static getDeserialized(serialized: ReturnType<CombatantAttributeProperties["getSerialized"]>) {
    const deserialized = new CombatantAttributeProperties();
    deserialized.inherentAttributes = serialized.inherentAttributes;
    deserialized.speccedAttributes = serialized.speccedAttributes;
    deserialized.unspentAttributePoints = serialized.unspentAttributePoints;

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

    const unmetAttributeRequirements = new Set<CombatAttribute>();
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

  requireUnspentAttributes() {
    if (this.getUnspentPoints() <= 0) {
      throw new Error(ERROR_MESSAGES.COMBATANT.NO_UNSPENT_ATTRIBUTE_POINTS);
    }
  }

  requireAttributeAllocatable(attribute: CombatAttribute) {
    if (!ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES.includes(attribute)) {
      throw new Error(ERROR_MESSAGES.COMBATANT.ATTRIBUTE_IS_NOT_ASSIGNABLE);
    }
  }
}
