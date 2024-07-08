import {
  DERIVED_ATTRIBUTE_RATIOS,
  DEX_TO_RANGED_ARMOR_PEN_RATIO,
  STR_TO_MELEE_ARMOR_PEN_RATIO,
} from "../app_consts";
import { Item, WeaponSlot } from "../items";
import { EquipmentProperties } from "../items/equipment/equipment-properties";
import { EquipmentType } from "../items/equipment/equipment-types";
import { ItemPropertiesType } from "../items/item-properties";
import { CombatAttribute } from "./combat-attributes";
import { CombatantAttributeRecord, CombatantProperties } from "./combatant-properties";

function initializeCombatAttributeRecord() {
  const allAttributesAsZero: CombatantAttributeRecord = {};
  for (const value of Object.values(CombatAttribute)) {
    if (typeof value === "string") continue;
    allAttributesAsZero[value] = 0;
  }
  return allAttributesAsZero as Record<CombatAttribute, number>;
}

export default function getCombatantTotalAttributes(
  combatantProperties: CombatantProperties
): Record<CombatAttribute, number> {
  const totalAttributes = initializeCombatAttributeRecord();
  addAttributesToAccumulator(combatantProperties.inherentAttributes, totalAttributes);
  addAttributesToAccumulator(combatantProperties.speccedAttributes, totalAttributes);

  for (const item of Object.values(combatantProperties.equipment)) {
    if (item.itemProperties.type !== ItemPropertiesType.Equipment) continue;
    addAttributesToAccumulator(item.itemProperties.equipmentProperties.attributes, totalAttributes);
    const baseArmorClass = EquipmentProperties.getBaseArmorClass(
      item.itemProperties.equipmentProperties
    );
    if (totalAttributes[CombatAttribute.ArmorClass])
      totalAttributes[CombatAttribute.ArmorClass] += baseArmorClass;
    else totalAttributes[CombatAttribute.ArmorClass] = baseArmorClass;
    // @TODO - add the %armor class trait to item generation and calculate it here
    // or on an equipment method and add it here
  }

  // after adding up attributes, determine if any equipped item still doesn't meet attribute
  // requirements, if so, remove it's attributes from the total
  for (const item of Object.values(combatantProperties.equipment)) {
    const equippedItemIsUsable = Item.requirementsMet(item, totalAttributes);
    if (equippedItemIsUsable) continue;
    if (item.itemProperties.type !== ItemPropertiesType.Equipment) continue;
    // otherwise subtract its stats
    removeAttributesFromAccumulator(
      item.itemProperties.equipmentProperties.attributes,
      totalAttributes
    );
    const baseArmorClass = EquipmentProperties.getBaseArmorClass(
      item.itemProperties.equipmentProperties
    );
    if (totalAttributes[CombatAttribute.ArmorClass])
      totalAttributes[CombatAttribute.ArmorClass] = Math.max(
        totalAttributes[CombatAttribute.ArmorClass] - baseArmorClass,
        0
      );
  }

  for (const [key, attributeRatios] of Object.entries(DERIVED_ATTRIBUTE_RATIOS)) {
    const mainAttribute = parseInt(key) as CombatAttribute;
    for (const [key, ratio] of Object.entries(attributeRatios)) {
      const derivedAttribute = parseInt(key) as CombatAttribute;
      calculateAndAddDerivedAttribute(totalAttributes, mainAttribute, derivedAttribute, ratio);
    }
  }

  const derivedArmorPen = getArmorPenDerivedBonus(combatantProperties, totalAttributes);
  if (!totalAttributes[CombatAttribute.ArmorPenetration])
    totalAttributes[CombatAttribute.ArmorPenetration] = 0;
  totalAttributes[CombatAttribute.ArmorPenetration] += derivedArmorPen;

  return totalAttributes;
}

function getArmorPenDerivedBonus(
  combatantProperties: CombatantProperties,
  totalAttributesLessArmorPenBonus: CombatantAttributeRecord
): number {
  const mhWeaponOption = CombatantProperties.getEquippedWeapon(
    combatantProperties,
    WeaponSlot.MainHand
  );
  let attributeToDeriveFrom = CombatAttribute.Strength;
  if (mhWeaponOption) {
    const weaponProperties = mhWeaponOption;
    if (weaponProperties.type === EquipmentType.TwoHandedRangedWeapon) {
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

export function addAttributesToAccumulator(
  toAdd: CombatantAttributeRecord,
  acc: CombatantAttributeRecord
) {
  for (const [key, value] of Object.entries(toAdd)) {
    const attribute = parseInt(key) as CombatAttribute;
    if (!acc[attribute]) acc[attribute] = value;
    else acc[attribute]! += value; // use ! because ts complains it may be undefined even though checked above
  }
}

function removeAttributesFromAccumulator(
  toRemove: CombatantAttributeRecord,
  acc: CombatantAttributeRecord
) {
  for (const [key, value] of Object.entries(toRemove)) {
    const attribute = parseInt(key) as CombatAttribute;
    if (!acc[attribute]) continue;
    else acc[attribute]! -= value; // use ! because ts complains it may be undefined even though checked above
    if (acc[attribute]! < 0) delete acc[attribute];
  }
}
