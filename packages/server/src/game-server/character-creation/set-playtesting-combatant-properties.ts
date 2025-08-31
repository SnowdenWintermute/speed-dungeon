import {
  CombatAttribute,
  CombatantClass,
  CombatantProperties,
  MagicalElement,
} from "@speed-dungeon/common";

export function setPlaytestingCombatantProperties(combatantProperties: CombatantProperties) {
  combatantProperties.level = 4;
  combatantProperties.unspentAttributePoints = 3;
  combatantProperties.abilityProperties.unspentAbilityPoints = 1;
  // combatantProperties.supportClassProperties = { combatantClass: CombatantClass.Rogue, level: 1 };

  combatantProperties.inherentAttributes = {
    ...combatantProperties.inherentAttributes,
    ...TESTING_INHERENT_ATTRIBUTES,
  };

  combatantProperties.abilityProperties.traitProperties.inherentElementalAffinities[
    MagicalElement.Fire
  ] = 150;
  combatantProperties.abilityProperties.traitProperties.inherentElementalAffinities[
    MagicalElement.Dark
  ] = -150;

  // combatantProperties.hitPoints = Math.floor(combatantProperties.hitPoints * 0.5);
  // CombatantProperties.changeMana(combatantProperties, 100);
  // combatantProperties.mana = Math.floor(combatantProperties.mana * 0.4);
  // combatantProperties.mana = 4;

  const elementalStaves = [];
  const runeSwords = [];
  for (let i = 0; i < 5; i += 1) {
    // const staff = generateSpecificEquipmentType(
    //   {
    //     equipmentType: EquipmentType.TwoHandedMeleeWeapon,
    //     baseItemType: TwoHandedMeleeWeapon.ElementalStaff,
    //   },
    //   true
    // );
    // elementalStaves.push(staff);
    // const sword = generateSpecificEquipmentType(
    //   {
    //     equipmentType: EquipmentType.OneHandedMeleeWeapon,
    //     baseItemType: OneHandedMeleeWeapon.RuneSword,
    //   },
    //   true
    // );
    // runeSwords.push(sword);
  }

  // combatantProperties.inventory.equipment.push(...elementalStaves);
  // combatantProperties.inventory.equipment.push(...runeSwords);
}

const TESTING_INHERENT_ATTRIBUTES: Partial<Record<CombatAttribute, number>> = {
  // [CombatAttribute.Speed]: 9,
  // [CombatAttribute.Dexterity]: 45,
  // [CombatAttribute.Strength]: 40,
  // [CombatAttribute.Spirit]: 25,
  // [CombatAttribute.Mp]: 100,
  // [CombatAttribute.Hp]: 75,
};
