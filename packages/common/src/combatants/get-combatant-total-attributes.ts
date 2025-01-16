import { DEX_TO_RANGED_ARMOR_PEN_RATIO, STR_TO_MELEE_ARMOR_PEN_RATIO } from "../app-consts.js";
import { Item } from "../items/index.js";
import { iterateNumericEnumKeyedRecord } from "../utils/index.js";
import { EquipmentType } from "../items/equipment/equipment-types/index.js";
import { CombatantAttributeRecord, CombatantProperties } from "./combatant-properties.js";
import { CombatAttribute } from "../attributes/index.js";
import { Equipment, HoldableSlotType } from "../items/equipment/index.js";
import { CombatantEquipment } from "./combatant-equipment/index.js";

// ATTRIBUTES
export const DERIVED_ATTRIBUTE_RATIOS: Partial<
  Record<CombatAttribute, Partial<Record<CombatAttribute, number>>>
> = {
  [CombatAttribute.Dexterity]: {
    [CombatAttribute.Accuracy]: 2,
  },
  [CombatAttribute.Intelligence]: {
    [CombatAttribute.Mp]: 2,
  },
  [CombatAttribute.Agility]: {
    [CombatAttribute.Evasion]: 2,
    [CombatAttribute.Speed]: 1,
  },
  [CombatAttribute.Vitality]: {
    [CombatAttribute.Hp]: 2,
    [CombatAttribute.ArmorClass]: 1.5,
  },
};

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

  const allEquippedItems = CombatantEquipment.getAllEquippedItems(combatantProperties, {
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
  const mhWeaponOption = CombatantProperties.getEquippedWeapon(
    combatantProperties,
    HoldableSlotType.MainHand
  );
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

export function addAttributesToAccumulator(
  toAdd: CombatantAttributeRecord,
  acc: CombatantAttributeRecord
) {
  for (const [attribute, value] of iterateNumericEnumKeyedRecord(toAdd)) {
    if (!acc[attribute]) acc[attribute] = value;
    else acc[attribute]! += value || 0; // use ! because ts complains it may be undefined even though checked above
  }
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
