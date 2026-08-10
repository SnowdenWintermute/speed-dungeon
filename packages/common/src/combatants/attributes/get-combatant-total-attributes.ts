import { Item } from "../../items/index.js";
import { iterateNumericEnumKeyedRecord } from "../../utils/index.js";
import { CombatAttribute } from "../attributes/index.js";
import { Equipment } from "../../items/equipment/index.js";
import { DERIVED_ATTRIBUTE_RATIOS } from "./derrived-attribute-ratios.js";
import { addAttributesToAccumulator } from "./add-attributes-to-accumulator.js";
import {
  BASE_STARTING_ATTRIBUTES,
  COMBATANT_CLASS_ATTRIBUTES_BY_LEVEL,
  MONSTER_ATTRIBUTES_BY_LEVEL,
  MONSTER_STARTING_ATTRIBUTES,
} from "./attribute-tables.generated.js";
import { CombatantProperties } from "../combatant-properties.js";
import { CombatantAttributeRecord } from "../combatant-attribute-record.js";

export function getCombatantTotalAttributes(
  combatantProperties: CombatantProperties
): Record<CombatAttribute, number> {
  const { attributeProperties } = combatantProperties;
  const totalAttributes = attributeProperties.getNaturalAttributes();

  if (attributeProperties.getUseExplicitAttributes()) {
    // floor everything
    for (const [attribute, value] of iterateNumericEnumKeyedRecord(totalAttributes)) {
      totalAttributes[attribute] = Math.floor(value);
    }
    return totalAttributes;
  }

  const { combatantClass, level } = combatantProperties.classProgressionProperties.getMainClass();
  const { monsterType } = combatantProperties;
  const supportClassPropertiesOption =
    combatantProperties.classProgressionProperties.getSupportClassOption();

  // monsters will have their attributes explicitly set instead of inferred by their classes
  if (monsterType === null) {
    const combatantClassStartingAttributes = BASE_STARTING_ATTRIBUTES[combatantClass];
    addAttributesToAccumulator(combatantClassStartingAttributes, totalAttributes);

    const combatantClassAttributesByLevel = COMBATANT_CLASS_ATTRIBUTES_BY_LEVEL[combatantClass];
    for (let i = 0; i < level; i += 1) {
      addAttributesToAccumulator(combatantClassAttributesByLevel, totalAttributes);
    }

    if (supportClassPropertiesOption !== null) {
      const { combatantClass, level } = supportClassPropertiesOption;
      const supportClassAttributesByLevel = COMBATANT_CLASS_ATTRIBUTES_BY_LEVEL[combatantClass];
      for (let i = 0; i < level; i += 1)
        addAttributesToAccumulator(supportClassAttributesByLevel, totalAttributes);
    }
  } else {
    const startingAttributes = MONSTER_STARTING_ATTRIBUTES[monsterType];
    addAttributesToAccumulator(startingAttributes, totalAttributes);

    const monsterAttributesByLevel = MONSTER_ATTRIBUTES_BY_LEVEL[monsterType];
    // don't add for level 1 monsters
    for (let i = 1; i < level; i += 1) {
      addAttributesToAccumulator(monsterAttributesByLevel, totalAttributes);
    }
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
        addAttributesToAccumulator(affixAttributesOtherThanArmorClass(affix), totalAttributes);
      }
    }
    const modifiedArmorClass = item.getModifiedArmorClass();
    if (totalAttributes[CombatAttribute.ArmorClass])
      totalAttributes[CombatAttribute.ArmorClass] += modifiedArmorClass;
    else totalAttributes[CombatAttribute.ArmorClass] = modifiedArmorClass;
  }

  // after adding up attributes, determine if any equipped item still doesn't meet attribute
  // requirements, if so, remove it's attributes from the total
  for (const item of allEquippedItems) {
    const equippedItemIsUsable =
      Item.requirementsMet(item, totalAttributes) &&
      !(item instanceof Equipment && item.isBroken());
    if (equippedItemIsUsable) continue;
    // otherwise subtract its stats
    removeAttributesFromAccumulator(item.attributes, totalAttributes);
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
  for (const [mainAttribute, attributeRatios] of iterateNumericEnumKeyedRecord(
    DERIVED_ATTRIBUTE_RATIOS
  )) {
    for (const [derivedAttribute, ratio] of iterateNumericEnumKeyedRecord(attributeRatios)) {
      calculateAndAddDerivedAttribute(totalAttributes, mainAttribute, derivedAttribute, ratio);
    }
  }

  // floor everything
  for (const [attribute, value] of iterateNumericEnumKeyedRecord(totalAttributes)) {
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
  for (const [attribute, value] of iterateNumericEnumKeyedRecord(toRemove)) {
    if (acc[attribute] === undefined) continue;
    else acc[attribute]! -= value || 0; // use ! because ts complains it may be undefined even though checked above
    if (acc[attribute]! < 0) delete acc[attribute];
  }
}
