import { DERIVED_ATTRIBUTE_RATIOS } from "../app_consts";
import { ItemPropertiesType } from "../items/item-properties";
import { CombatAttribute } from "./combat-attributes";
import { CombatantAttributeRecord, CombatantProperties } from "./combatant-properties";

export default function getCombatantTotalAttributes(this: CombatantProperties) {
  const totalAttributes: CombatantAttributeRecord = {};

  addAttributesToAccumulator(this.inherentAttributes, totalAttributes);
  addAttributesToAccumulator(this.speccedAttributes, totalAttributes);

  for (const item of Object.values(this.equipment)) {
    if (item.itemProperties.type !== ItemPropertiesType.Equipment) continue;
    addAttributesToAccumulator(item.itemProperties.equipmentProperties.attributes, totalAttributes);
    const baseArmorClass = item.itemProperties.equipmentProperties.getBaseArmorClass();
    if (totalAttributes[CombatAttribute.ArmorClass])
      totalAttributes[CombatAttribute.ArmorClass] += baseArmorClass;
    else totalAttributes[CombatAttribute.ArmorClass] = baseArmorClass;
    // @TODO - add the %armor class trait to item generation and calculate it here
    // or on an equipment method and add it here
  }

  // after adding up attributes, determine if any equipped item still doesn't meet attribute
  // requirements, if so, remove it's attributes from the total
  for (const item of Object.values(this.equipment)) {
    const equippedItemIsUsable = item.requirementsMet(totalAttributes);
    if (equippedItemIsUsable) continue;
    if (item.itemProperties.type !== ItemPropertiesType.Equipment) continue;
    // otherwise subtract its stats
    removeAttributesFromAccumulator(
      item.itemProperties.equipmentProperties.attributes,
      totalAttributes
    );
    const baseArmorClass = item.itemProperties.equipmentProperties.getBaseArmorClass();
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

  // armor penetration based on equipped MH weapon type
  // let mh_equipment_option = combatant_properties.get_equipped_item(&EquipmentSlots::MainHand);
  // // check for sheilds since they can't be used to attack
  // let mh_weapon_option = EquipmentProperties::get_weapon_equipment_properties_option_from_equipment_properties_option(mh_equipment_option);
  // let weapon_type_equipped = match mh_weapon_option {
  //   Some(equipment_properties) => match equipment_properties.equipment_type {
  //       EquipmentTypes::TwoHandedRangedWeapon(_, _) => MeleeOrRanged::Ranged,
  //       _ => MeleeOrRanged::Melee,
  //   },
  //   None => MeleeOrRanged::Melee,
  // };

  // let mut total_attributes = combatant_properties.get_total_attributes();
  // let armor_pen_attribute_bonus_based_on_weapon_type = match weapon_type_equipped {
  //   MeleeOrRanged::Melee => {
  //       CombatantProperties::get_armor_pen_derrived_attribute_based_on_weapon_type(
  //           &total_attributes,
  //           &CombatAttributes::Strength,
  //       )
  //   }
  //   MeleeOrRanged::Ranged => {
  //       CombatantProperties::get_armor_pen_derrived_attribute_based_on_weapon_type(
  //           &total_attributes,
  //           &CombatAttributes::Dexterity,
  //       )
  //   }
  // };
  // let total_armor_pen = total_attributes
  //   .entry(CombatAttributes::ArmorPenetration)
  //   .or_insert(0);
  // *total_armor_pen += armor_pen_attribute_bonus_based_on_weapon_type;

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

function addAttributesToAccumulator(
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
