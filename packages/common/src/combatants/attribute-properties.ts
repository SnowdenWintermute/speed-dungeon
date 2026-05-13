import makeAutoObservable from "mobx-store-inheritance";
import { ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES, CombatAttribute } from "./attributes/index.js";
import { addAttributesToAccumulator } from "./attributes/add-attributes-to-accumulator.js";
import { iterateNumericEnumKeyedRecord } from "../utils/index.js";
import { getCombatantTotalAttributes } from "./attributes/get-combatant-total-attributes.js";
import { Item } from "../items/index.js";
import { CombatantSubsystem } from "./combatant-subsystem.js";
import { initializeCombatAttributeRecord } from "./attributes/initialize-combat-attribute-record.js";
import { CombatantAttributeRecord } from "./combatant-attribute-record.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { ReactiveNode, Serializable, SerializedOf } from "../serialization/index.js";

export class CombatantAttributeProperties
  extends CombatantSubsystem
  implements ReactiveNode, Serializable
{
  private speccedAttributes: CombatantAttributeRecord = {};
  private unspentAttributePoints: number = 0;
  private _useExplicitAttributes: boolean = false;

  makeObservable(): void {
    makeAutoObservable(this);
  }

  setUseExplicitAttributes() {
    this._useExplicitAttributes = true;
  }

  getUseExplicitAttributes() {
    return this._useExplicitAttributes;
  }

  toSerialized() {
    return {
      speccedAttributes: this.speccedAttributes,
      unspentAttributePoints: this.unspentAttributePoints,
      useExplicitAttributes: this._useExplicitAttributes,
    };
  }

  static fromSerialized(serialized: SerializedOf<CombatantAttributeProperties>) {
    const result = new CombatantAttributeProperties();
    result.speccedAttributes = serialized.speccedAttributes;
    result.unspentAttributePoints = serialized.unspentAttributePoints;
    result._useExplicitAttributes = serialized.useExplicitAttributes;

    return result;
  }

  allocatePoint(attribute: CombatAttribute) {
    this.getCombatantProperties().resources.maintainResourcePercentagesAfterEffect(() => {
      const currentAttributeValue = this.speccedAttributes[attribute] || 0;
      this.speccedAttributes[attribute] = currentAttributeValue + 1;
      this.unspentAttributePoints -= 1;
    });
  }

  setSpeccedAttributeValue(attribute: CombatAttribute, value: number) {
    this.speccedAttributes[attribute] = value;
  }

  changeUnspentPoints(value: number) {
    this.unspentAttributePoints += value;
  }

  getUnspentPoints() {
    return this.unspentAttributePoints;
  }

  getNaturalAttributes() {
    const total = initializeCombatAttributeRecord();
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
