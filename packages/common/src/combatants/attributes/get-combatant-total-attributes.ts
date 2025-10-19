import { DEX_TO_RANGED_ARMOR_PEN_RATIO, STR_TO_MELEE_ARMOR_PEN_RATIO } from "../../app-consts.js";
import { Item } from "../../items/index.js";
import { iterateNumericEnumKeyedRecord } from "../../utils/index.js";
import { EquipmentType } from "../../items/equipment/equipment-types/index.js";
import { BASE_STARTING_ATTRIBUTES, CombatantProperties } from "../index.js";
import { CombatAttribute, initializeCombatAttributeRecord } from "../attributes/index.js";
import { Equipment, HoldableSlotType } from "../../items/equipment/index.js";
import { DERIVED_ATTRIBUTE_RATIOS } from "./derrived-attribute-ratios.js";
import { addAttributesToAccumulator } from "./add-attributes-to-accumulator.js";
import { COMBATANT_CLASS_ATTRIBUTES_BY_LEVEL } from "../combatant-class/class-attributes-by-level.js";
import { CombatantAttributeRecord } from "../attribute-properties.js";

export function getCombatantTotalAttributes(
  combatantProperties: CombatantProperties
): Record<CombatAttribute, number> {
  const totalAttributes = initializeCombatAttributeRecord();
  const { attributeProperties } = combatantProperties;
  addAttributesToAccumulator(attributeProperties.inherentAttributes, totalAttributes);
  addAttributesToAccumulator(attributeProperties.speccedAttributes, totalAttributes);
  const { combatantClass, monsterType } = combatantProperties;
  const supportClassPropertiesOption = combatantProperties.supportClassProperties;

  const combatantClassStartingAttributes = BASE_STARTING_ATTRIBUTES[combatantClass];
  addAttributesToAccumulator(combatantClassStartingAttributes, totalAttributes);

  const combatantClassAttributesByLevel = COMBATANT_CLASS_ATTRIBUTES_BY_LEVEL[combatantClass];
  for (let i = 0; i < combatantProperties.level; i += 1)
    addAttributesToAccumulator(combatantClassAttributesByLevel, totalAttributes);

  if (supportClassPropertiesOption !== null) {
    const { combatantClass, level } = supportClassPropertiesOption;
    const supportClassAttributesByLevel = COMBATANT_CLASS_ATTRIBUTES_BY_LEVEL[combatantClass];
    for (let i = 0; i < level; i += 1)
      addAttributesToAccumulator(supportClassAttributesByLevel, totalAttributes);
  }

  const allEquippedItems = combatantProperties.equipment.getAllEquippedItems({
    includeUnselectedHotswapSlots: false,
  });
  // you have to add the attributes first, then subtract them later if item is unusable
  // because some of the equipped items may be giving enough attributes that they can
  // actually be used BECAUSE they are equipped
  for (const item of allEquippedItems) {
    addAttributesToAccumulator(item.attributes, totalAttributes);
    for (const category of Object.values(item.affixes)) {
      for (const affix of Object.values(category)) {
        addAttributesToAccumulator(affix.combatAttributes, totalAttributes);
      }
    }
    const modifiedArmorClass = Equipment.getModifiedArmorClass(item);
    if (totalAttributes[CombatAttribute.ArmorClass])
      totalAttributes[CombatAttribute.ArmorClass] += modifiedArmorClass;
    else totalAttributes[CombatAttribute.ArmorClass] = modifiedArmorClass;
  }

  // after adding up attributes, determine if any equipped item still doesn't meet attribute
  // requirements, if so, remove it's attributes from the total
  for (const item of allEquippedItems) {
    const equippedItemIsUsable =
      Item.requirementsMet(item, totalAttributes) &&
      !(item instanceof Equipment && Equipment.isBroken(item));
    if (equippedItemIsUsable) continue;
    // otherwise subtract its stats
    removeAttributesFromAccumulator(item.attributes, totalAttributes);
    for (const category of Object.values(item.affixes)) {
      for (const affix of Object.values(category)) {
        removeAttributesFromAccumulator(affix.combatAttributes, totalAttributes);
      }
    }
    const baseArmorClass = Equipment.getBaseArmorClass(item);
    if (totalAttributes[CombatAttribute.ArmorClass])
      totalAttributes[CombatAttribute.ArmorClass] = Math.max(
        totalAttributes[CombatAttribute.ArmorClass] - baseArmorClass,
        0
      );
  }

  // CONDITIONS
  for (const condition of combatantProperties.conditions) {
    if (!condition.getAttributeModifiers) continue;
    const attributesFromCondition = condition.getAttributeModifiers(condition, combatantProperties);
    addAttributesToAccumulator(attributesFromCondition, totalAttributes);
  }

  for (const [mainAttribute, attributeRatios] of iterateNumericEnumKeyedRecord(
    DERIVED_ATTRIBUTE_RATIOS
  )) {
    for (const [derivedAttribute, ratio] of iterateNumericEnumKeyedRecord(attributeRatios)) {
      calculateAndAddDerivedAttribute(totalAttributes, mainAttribute, derivedAttribute, ratio);
    }
  }

  const derivedArmorPen = getArmorPenDerivedBonus(combatantProperties, totalAttributes);
  if (!totalAttributes[CombatAttribute.ArmorPenetration])
    totalAttributes[CombatAttribute.ArmorPenetration] = 0;
  totalAttributes[CombatAttribute.ArmorPenetration] += derivedArmorPen;

  // floor everything
  for (const [attribute, value] of iterateNumericEnumKeyedRecord(totalAttributes)) {
    totalAttributes[attribute] = Math.floor(value);
  }

  return totalAttributes;
}

function getArmorPenDerivedBonus(
  combatantProperties: CombatantProperties,
  totalAttributesLessArmorPenBonus: CombatantAttributeRecord
): number {
  const mhWeaponOption = combatantProperties.equipment.getEquippedWeapon(HoldableSlotType.MainHand);
  if (mhWeaponOption instanceof Error) return 0;
  let attributeToDeriveFrom = CombatAttribute.Strength;
  if (mhWeaponOption) {
    const weaponProperties = mhWeaponOption;
    if (
      weaponProperties.taggedBaseEquipment.equipmentType === EquipmentType.TwoHandedRangedWeapon
    ) {
      attributeToDeriveFrom = CombatAttribute.Dexterity;
    }
  }

  const attributeQuantity = totalAttributesLessArmorPenBonus[attributeToDeriveFrom] || 0;

  switch (attributeToDeriveFrom) {
    case CombatAttribute.Strength:
      return attributeQuantity * STR_TO_MELEE_ARMOR_PEN_RATIO;
    case CombatAttribute.Dexterity:
      return attributeQuantity * DEX_TO_RANGED_ARMOR_PEN_RATIO;
  }
}

function calculateAndAddDerivedAttribute(
  totalAttributes: CombatantAttributeRecord,
  mainAttribute: CombatAttribute,
  derivedAttribute: CombatAttribute,
  ratio: number
) {
  const totalMainAttributeOption = totalAttributes[mainAttribute];
  if (!totalMainAttributeOption) return;
  const totalDerrived = totalAttributes[derivedAttribute] || 0;
  const derrivedToAdd = Math.floor(totalMainAttributeOption * ratio);
  const newTotalDerrived = totalDerrived + derrivedToAdd;
  totalAttributes[derivedAttribute] = newTotalDerrived;
}

function removeAttributesFromAccumulator(
  toRemove: CombatantAttributeRecord,
  acc: CombatantAttributeRecord
) {
  for (const [attribute, value] of iterateNumericEnumKeyedRecord(toRemove)) {
    if (acc[attribute] === undefined) continue;
    else acc[attribute]! -= value || 0; // use ! because ts complains it may be undefined even though checked above
    if (acc[attribute]! < 0) delete acc[attribute];
  }
}
