import {
  CombatAttribute,
  CombatantClass,
  CombatantProperties,
  MagicalElement,
} from "@speed-dungeon/common";

export function setPlaytestingCombatantProperties(combatantProperties: CombatantProperties) {
  // combatantProperties.level = 10;
  // combatantProperties.unspentAttributePoints = 30;
  // combatantProperties.abilityProperties.unspentAbilityPoints = 6;
  // // combatantProperties.supportClassProperties = { combatantClass: CombatantClass.Rogue, level: 1 };

  // if (combatantProperties.combatantClass === CombatantClass.Mage)
  //   combatantProperties.inherentAttributes[CombatAttribute.Spirit] = 200;

  // combatantProperties.inherentAttributes = {
  //   ...combatantProperties.inherentAttributes,
  //   ...TESTING_INHERENT_ATTRIBUTES,
  // };

  // combatantProperties.abilityProperties.traitProperties.inherentElementalAffinities[
  //   MagicalElement.Fire
  // ] = 200;
  // combatantProperties.abilityProperties.traitProperties.inherentElementalAffinities[
  //   MagicalElement.Dark
  // ] = -150;

  // combatantProperties.hitPoints = Math.floor(combatantProperties.hitPoints * 0.5);
  // combatantProperties.hitPoints = 4;
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
  [CombatAttribute.Speed]: 9,
  [CombatAttribute.Dexterity]: 9,
  // [CombatAttribute.Accuracy]: 200,
  // [CombatAttribute.Strength]: 40,
  // [CombatAttribute.Spirit]: 10,
  // [CombatAttribute.Mp]: 100,
  // [CombatAttribute.Evasion]: 100,
  // [CombatAttribute.Hp]: 759,
};
