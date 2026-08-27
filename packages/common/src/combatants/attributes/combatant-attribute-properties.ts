import makeAutoObservable from "mobx-store-inheritance";
import {
  ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES,
  COMBAT_ATTRIBUTES,
  CombatAttribute,
} from "./index.js";
import {
  addAttributesToAccumulator,
  addMultipliedAttributesToAccumulator,
  removeAttributesFromAccumulator,
} from "./add-attributes-to-accumulator.js";
import { Item } from "../../items/index.js";
import { CombatantSubsystem } from "../combatant-subsystem.js";
import { initializeCombatAttributeRecord } from "./initialize-combat-attribute-record.js";
import { CombatantAttributeRecord } from "./combatant-attribute-record.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { ReactiveNode, Serializable, SerializedOf } from "../../serialization/index.js";
import {
  BASE_STARTING_ATTRIBUTES,
  COMBATANT_CLASS_ATTRIBUTES_BY_LEVEL,
  MONSTER_ATTRIBUTES_BY_LEVEL,
  MONSTER_STARTING_ATTRIBUTES,
} from "./attribute-tables.generated.js";
import { MonsterType } from "../../monsters/monster-types.js";
import { DERIVED_ATTRIBUTE_RATIO_LIST } from "./derrived-attribute-ratios.js";
import { Equipment } from "../../items/equipment/index.js";
import { EquipmentSlot } from "../combatant-equipment/equipment-slot.js";

export class CombatantAttributeProperties
  extends CombatantSubsystem
  implements ReactiveNode, Serializable
{
  private _speccedAttributes: CombatantAttributeRecord = {};
  private _unspentAttributePoints: number = 0;
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
      speccedAttributes: this._speccedAttributes,
      unspentAttributePoints: this._unspentAttributePoints,
      useExplicitAttributes: this._useExplicitAttributes,
    };
  }

  static fromSerialized(serialized: SerializedOf<CombatantAttributeProperties>) {
    const result = new CombatantAttributeProperties();
    result._speccedAttributes = serialized.speccedAttributes;
    result._unspentAttributePoints = serialized.unspentAttributePoints;
    result._useExplicitAttributes = serialized.useExplicitAttributes;

    return result;
  }

  allocatePoint(attribute: CombatAttribute) {
    this.getCombatantProperties().resources.maintainResourcePercentagesAfterEffect(() => {
      const currentAttributeValue = this._speccedAttributes[attribute] || 0;
      this._speccedAttributes[attribute] = currentAttributeValue + 1;
      this._unspentAttributePoints -= 1;
    });
  }

  unallocatePoint(attribute: CombatAttribute) {
    this.getCombatantProperties().resources.maintainResourcePercentagesAfterEffect(() => {
      const currentAttributeValue = this._speccedAttributes[attribute];
      if (currentAttributeValue === undefined || currentAttributeValue < 1) {
        throw new Error("Expected to have an attribute point allocated");
      }
      this._speccedAttributes[attribute] = currentAttributeValue - 1;
      this._unspentAttributePoints += 1;
    });
  }

  setSpeccedAttributeValue(attribute: CombatAttribute, value: number) {
    this._speccedAttributes[attribute] = value;
  }

  changeUnspentPoints(value: number) {
    this._unspentAttributePoints += value;
  }

  getUnspentPoints() {
    return this._unspentAttributePoints;
  }

  getAllocatedAttributes() {
    const total = initializeCombatAttributeRecord();
    addAttributesToAccumulator(this._speccedAttributes, total);
    return total;
  }

  getAttributeValue(attribute: CombatAttribute) {
    return this.getTotalAttributes()[attribute];
  }

  getUnmetItemRequirements(item: Item) {
    const totalAttributes = this.getTotalAttributes();

    const unmetAttributeRequirements = new Set<CombatAttribute>();
    for (const attribute of COMBAT_ATTRIBUTES) {
      const value = item.requirements[attribute];
      if (value === undefined) {
        continue;
      }
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
    const isAssignable = ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES.some(
      (assignable) => assignable === attribute
    );

    if (!isAssignable) {
      throw new Error(ERROR_MESSAGES.COMBATANT.ATTRIBUTE_IS_NOT_ASSIGNABLE);
    }
  }

  private getPlayerCharacterInherentAttributes() {
    const combatantProperties = this.getCombatantProperties();
    const { classProgressionProperties } = combatantProperties;
    const { combatantClass, level } = classProgressionProperties.getMainClass();

    const supportClassPropertiesOption = classProgressionProperties.getSupportClassOption();

    const result = initializeCombatAttributeRecord();
    const combatantClassStartingAttributes = BASE_STARTING_ATTRIBUTES[combatantClass];
    addAttributesToAccumulator(combatantClassStartingAttributes, result);

    const combatantClassAttributesByLevel = COMBATANT_CLASS_ATTRIBUTES_BY_LEVEL[combatantClass];
    addMultipliedAttributesToAccumulator(combatantClassAttributesByLevel, result, level);

    if (supportClassPropertiesOption !== null) {
      const { combatantClass, level } = supportClassPropertiesOption;
      const supportClassAttributesByLevel = COMBATANT_CLASS_ATTRIBUTES_BY_LEVEL[combatantClass];
      addMultipliedAttributesToAccumulator(supportClassAttributesByLevel, result, level);
    }

    return result;
  }

  // monsters will have their attributes explicitly set instead of inferred by their classes
  private getMonsterInherentAttributes(monsterType: MonsterType) {
    const combatantProperties = this.getCombatantProperties();
    const { classProgressionProperties } = combatantProperties;
    const { level } = classProgressionProperties.getMainClass();

    const result = initializeCombatAttributeRecord();
    const startingAttributes = MONSTER_STARTING_ATTRIBUTES[monsterType];
    addAttributesToAccumulator(startingAttributes, result);

    const monsterAttributesByLevel = MONSTER_ATTRIBUTES_BY_LEVEL[monsterType];
    // don't add for level 1 monsters
    addMultipliedAttributesToAccumulator(monsterAttributesByLevel, result, level - 1);

    return result;
  }

  getInherentAttributes() {
    const { monsterType } = this.getCombatantProperties();
    const isPlayerCharacter = monsterType === null;

    if (isPlayerCharacter) {
      return this.getPlayerCharacterInherentAttributes();
    } else {
      return this.getMonsterInherentAttributes(monsterType);
    }
  }

  private floorRecord(record: CombatantAttributeRecord) {
    for (const attribute of COMBAT_ATTRIBUTES) {
      const value = record[attribute];
      if (value === undefined) {
        continue;
      }
      record[attribute] = Math.floor(value);
    }
  }

  private getExplicitlySetAttributes() {
    const totalAttributes = this.getAllocatedAttributes();
    this.floorRecord(totalAttributes);
    return totalAttributes;
  }

  private addAttributesFromConditions(runningTotal: Record<CombatAttribute, number>) {
    const combatantProperties = this.getCombatantProperties();
    for (const condition of combatantProperties.conditionManager.getConditions()) {
      if (!condition.getAttributeModifiers) {
        continue;
      }
      const attributesFromCondition = condition.getAttributeModifiers(combatantProperties);
      addAttributesToAccumulator(attributesFromCondition, runningTotal);
    }
  }

  private addDerivedAttributes(runningTotal: CombatantAttributeRecord) {
    for (const { mainAttribute, derivedAttribute, ratio } of DERIVED_ATTRIBUTE_RATIO_LIST) {
      const totalMainAttributeOption = runningTotal[mainAttribute];
      if (!totalMainAttributeOption) {
        continue;
      }
      const totalDerrived = runningTotal[derivedAttribute] || 0;
      const derrivedToAdd = Math.floor(totalMainAttributeOption * ratio);
      const newTotalDerrived = totalDerrived + derrivedToAdd;
      runningTotal[derivedAttribute] = newTotalDerrived;
    }
  }

  private addAttributesFromEquipment(runningTotal: Record<CombatAttribute, number>) {
    const combatantProperties = this.getCombatantProperties();
    const allEquippedItems = combatantProperties.equipment.getAllEquippedItems({
      includeUnselectedHotswapSlots: false,
    });
    // we add the attributes first, then subtract them later if item is unusable
    // because some of the equipped items may be giving enough attributes that they can
    // actually be used BECAUSE they are equipped
    const attributesOnWornEquipment = Equipment.getAttributesOnEquipmentList(allEquippedItems);
    addAttributesToAccumulator(attributesOnWornEquipment, runningTotal);

    // after adding up attributes, determine if any equipped item still doesn't meet attribute
    // requirements, if so, remove it's attributes from the total
    const unmetRequirementsEquipment: Equipment[] = [];
    for (const equipment of allEquippedItems) {
      const equippedItemIsUsable =
        Item.requirementsMet(equipment, runningTotal) && !equipment.isBroken();
      if (!equippedItemIsUsable) {
        unmetRequirementsEquipment.push(equipment);
      }
    }
    const attributesFromUnmetRequirementsEquipment = Equipment.getAttributesOnEquipmentList(
      unmetRequirementsEquipment
    );
    removeAttributesFromAccumulator(attributesFromUnmetRequirementsEquipment, runningTotal);
  }

  getTotalAttributes(): Record<CombatAttribute, number> {
    if (this.getUseExplicitAttributes()) {
      return this.getExplicitlySetAttributes();
    }

    const runningTotal = this.getInherentAttributes();
    const allocated = this.getAllocatedAttributes();
    addAttributesToAccumulator(allocated, runningTotal);
    this.addAttributesFromConditions(runningTotal);
    this.addAttributesFromEquipment(runningTotal);
    this.addDerivedAttributes(runningTotal);
    this.floorRecord(runningTotal);

    return runningTotal;
  }
}
