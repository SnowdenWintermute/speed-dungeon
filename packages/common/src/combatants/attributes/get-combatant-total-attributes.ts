import { Item } from "../../items/index.js";
import { COMBAT_ATTRIBUTES, CombatAttribute } from "../attributes/index.js";
import { Equipment } from "../../items/equipment/index.js";
import { DERIVED_ATTRIBUTE_RATIO_LIST } from "./derrived-attribute-ratios.js";
import { addAttributesToAccumulator } from "./add-attributes-to-accumulator.js";
import { CombatantProperties } from "../combatant-properties.js";
import { CombatantAttributeRecord } from "./combatant-attribute-record.js";

export function getCombatantTotalAttributes(
  combatantProperties: CombatantProperties
): Record<CombatAttribute, number> {
  const { attributeProperties } = combatantProperties;
  const totalAttributes = attributeProperties.getAllocatedAttributes();

  if (attributeProperties.getUseExplicitAttributes()) {
    // floor everything
    for (const attribute of COMBAT_ATTRIBUTES) {
      const value = totalAttributes[attribute];
      if (value === undefined) {
        continue;
      }
      totalAttributes[attribute] = Math.floor(value);
    }
    return totalAttributes;
  }

  const inherent = combatantProperties.attributeProperties.getInherentAttributes();
  addAttributesToAccumulator(inherent, totalAttributes);

  const allEquippedItems = combatantProperties.equipment.getAllEquippedItems({
    includeUnselectedHotswapSlots: false,
  });
  // you have to add the attributes first, then subtract them later if item is unusable
  // because some of the equipped items may be giving enough attributes that they can
  // actually be used BECAUSE they are equipped
  for (const item of allEquippedItems) {
    for (const category of Object.values(item.affixes)) {
      for (const affix of Object.values(category)) {
        addAttributesToAccumulator(affixAttributesOtherThanArmorClass(affix), totalAttributes);
      }
    }
    const modifiedArmorClass = item.getModifiedArmorClass();
    if (totalAttributes[CombatAttribute.ArmorClass]) {
      totalAttributes[CombatAttribute.ArmorClass] += modifiedArmorClass;
    } else {
      totalAttributes[CombatAttribute.ArmorClass] = modifiedArmorClass;
    }
  }

  // after adding up attributes, determine if any equipped item still doesn't meet attribute
  // requirements, if so, remove it's attributes from the total
  for (const item of allEquippedItems) {
    const equippedItemIsUsable =
      Item.requirementsMet(item, totalAttributes) &&
      !(item instanceof Equipment && item.isBroken());

    if (equippedItemIsUsable) {
      continue;
    }

    // otherwise subtract its stats
    for (const category of Object.values(item.affixes)) {
      for (const affix of Object.values(category)) {
        removeAttributesFromAccumulator(affixAttributesOtherThanArmorClass(affix), totalAttributes);
      }
    }
    if (totalAttributes[CombatAttribute.ArmorClass]) {
      totalAttributes[CombatAttribute.ArmorClass] = Math.max(
        totalAttributes[CombatAttribute.ArmorClass] - item.getModifiedArmorClass(),
        0
      );
    }
  }

  // CONDITIONS
  for (const condition of combatantProperties.conditionManager.getConditions()) {
    if (!condition.getAttributeModifiers) continue;
    const attributesFromCondition = condition.getAttributeModifiers(combatantProperties);
    addAttributesToAccumulator(attributesFromCondition, totalAttributes);
  }

  // DERIVED
  for (const { mainAttribute, derivedAttribute, ratio } of DERIVED_ATTRIBUTE_RATIO_LIST) {
    calculateAndAddDerivedAttribute(totalAttributes, mainAttribute, derivedAttribute, ratio);
  }

  // floor everything
  for (const attribute of COMBAT_ATTRIBUTES) {
    const value = totalAttributes[attribute];
    if (value === undefined) {
      continue;
    }
    totalAttributes[attribute] = Math.floor(value);
  }

  return totalAttributes;
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

/** Armor class on equipment is owned by getModifiedArmorClass, which already folds in the
 * FlatArmorClass affix and applies any percent modifier to it. Letting the same affix through the
 * attribute accumulator as well would count it twice. */
function affixAttributesOtherThanArmorClass(affix: {
  combatAttributes: CombatantAttributeRecord;
}): CombatantAttributeRecord {
  const attributes = { ...affix.combatAttributes };
  delete attributes[CombatAttribute.ArmorClass];
  return attributes;
}

function removeAttributesFromAccumulator(
  toRemove: CombatantAttributeRecord,
  acc: CombatantAttributeRecord
) {
  for (const attribute of COMBAT_ATTRIBUTES) {
    const value = toRemove[attribute];
    const existing = acc[attribute];
    if (value === undefined || existing === undefined) {
      continue;
    }
    const remaining = existing - value;
    if (remaining < 0) {
      delete acc[attribute];
    } else {
      acc[attribute] = remaining;
    }
  }
}
