import { CombatAttribute, CombatantAttributeRecord, MonsterType } from "@speed-dungeon/common";

export default function getMonsterPerLevelAttributes(
  monsterType: MonsterType
): CombatantAttributeRecord {
  const attributes: CombatantAttributeRecord = {};
  switch (monsterType) {
    case MonsterType.Zombie:
      attributes[CombatAttribute.Strength] = 8.0;
      attributes[CombatAttribute.Dexterity] = 2.0;
      attributes[CombatAttribute.Vitality] = 4.0;
      attributes[CombatAttribute.Hp] = 7.0;
      attributes[CombatAttribute.Mp] = 0.0;
      attributes[CombatAttribute.Agility] = 0.5;
      attributes[CombatAttribute.ArmorClass] = 10.0;
      attributes[CombatAttribute.Evasion] = 1;
      break;
    case MonsterType.SkeletonArcher:
      attributes[CombatAttribute.Dexterity] = 12.0;
      attributes[CombatAttribute.Vitality] = 1.5;
      attributes[CombatAttribute.Hp] = 5.5;
      attributes[CombatAttribute.Agility] = 1.5;
      attributes[CombatAttribute.ArmorClass] = 5.0;
      attributes[CombatAttribute.Evasion] = 8;
      break;
    case MonsterType.Scavenger:
      attributes[CombatAttribute.Dexterity] = 6.0;
      attributes[CombatAttribute.Strength] = 8.0;
      attributes[CombatAttribute.Vitality] = 1.5;
      attributes[CombatAttribute.Hp] = 4.5;
      attributes[CombatAttribute.Mp] = 0.0;
      attributes[CombatAttribute.Agility] = 2.0;
      attributes[CombatAttribute.ArmorClass] = 7.5;
      attributes[CombatAttribute.Evasion] = 12;
      break;
    case MonsterType.Vulture:
      attributes[CombatAttribute.Dexterity] = 8.0;
      attributes[CombatAttribute.Strength] = 6.0;
      attributes[CombatAttribute.Vitality] = 1.5;
      attributes[CombatAttribute.Hp] = 4.5;
      attributes[CombatAttribute.Agility] = 1.5;
      attributes[CombatAttribute.ArmorClass] = 7.5;
      attributes[CombatAttribute.Evasion] = 14;
      break;
    case MonsterType.FireMage:
      attributes[CombatAttribute.Spirit] = 10.0;
      attributes[CombatAttribute.Vitality] = 1.5;
      attributes[CombatAttribute.Hp] = 4.5;
      attributes[CombatAttribute.Agility] = 1.5;
      attributes[CombatAttribute.ArmorClass] = 2.5;
      attributes[CombatAttribute.Evasion] = 1;

      break;
    case MonsterType.Cultist:
      // attributes[CombatAttribute.Speed] = 1;
      attributes[CombatAttribute.Spirit] = 14.0;
      // attributes[CombatAttribute.Vitality] = 1.5;
      // attributes[CombatAttribute.Hp] = 4.5;
      attributes[CombatAttribute.Hp] = 0;
      attributes[CombatAttribute.Agility] = 1.5;
      // attributes[CombatAttribute.ArmorClass] = 2.5;
      attributes[CombatAttribute.Evasion] = 10;
      break;
    case MonsterType.FireElemental:
      attributes[CombatAttribute.Spirit] = 6.0;
      attributes[CombatAttribute.Vitality] = 1.0;
      attributes[CombatAttribute.Hp] = 4.0;
      attributes[CombatAttribute.Agility] = 1.5;
      break;
    case MonsterType.IceElemental:
      attributes[CombatAttribute.Spirit] = 6.0;
      attributes[CombatAttribute.Vitality] = 1.0;
      attributes[CombatAttribute.Hp] = 4.0;
      attributes[CombatAttribute.Agility] = 1.5;
      break;
    case MonsterType.MetallicGolem:
      attributes[CombatAttribute.Dexterity] = 4.0;
      attributes[CombatAttribute.Strength] = 14.0;
      attributes[CombatAttribute.Vitality] = 2.0;
      attributes[CombatAttribute.ArmorClass] = 18.0;
      attributes[CombatAttribute.Hp] = 9.5;
      attributes[CombatAttribute.Agility] = 1.5;
      break;
  }

  return attributes;
}
