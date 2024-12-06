import { CombatAttribute, CombatantAttributeRecord, MonsterType } from "@speed-dungeon/common";

export default function getMonsterPerLevelAttributes(
  monsterType: MonsterType
): CombatantAttributeRecord {
  const attributes: CombatantAttributeRecord = {};
  switch (monsterType) {
    case MonsterType.Zombie:
      attributes[CombatAttribute.Damage] = 4.0;
      attributes[CombatAttribute.Strength] = 3.0;
      attributes[CombatAttribute.Dexterity] = 1.0;
      attributes[CombatAttribute.Vitality] = 2.0;
      // attributes[CombatAttribute.Hp] = 7.0;
      attributes[CombatAttribute.Mp] = 0.0;
      attributes[CombatAttribute.Agility] = 0.5;
      attributes[CombatAttribute.ArmorClass] = 10.0;

    case MonsterType.SkeletonArcher:
      attributes[CombatAttribute.Damage] = 3.0;
      attributes[CombatAttribute.Dexterity] = 3.0;
      attributes[CombatAttribute.Vitality] = 1.0;
      attributes[CombatAttribute.Hp] = 5.5;
      attributes[CombatAttribute.Agility] = 1.5;
      attributes[CombatAttribute.ArmorClass] = 5.0;

    case MonsterType.Scavenger:
      attributes[CombatAttribute.Damage] = 3.0;
      attributes[CombatAttribute.Dexterity] = 2.0;
      attributes[CombatAttribute.Strength] = 2.0;
      attributes[CombatAttribute.Vitality] = 1.5;
      // attributes[CombatAttribute.Hp] = 4.5;
      attributes[CombatAttribute.Mp] = 0.0;
      attributes[CombatAttribute.Agility] = 1.5;
      attributes[CombatAttribute.ArmorClass] = 7.5;

    case MonsterType.Vulture:
      attributes[CombatAttribute.Damage] = 3.0;
      attributes[CombatAttribute.Dexterity] = 2.5;
      attributes[CombatAttribute.Strength] = 1.5;
      attributes[CombatAttribute.Vitality] = 1.5;
      attributes[CombatAttribute.Hp] = 4.5;
      attributes[CombatAttribute.Agility] = 1.5;
      attributes[CombatAttribute.ArmorClass] = 7.5;

    case MonsterType.FireMage:
      attributes[CombatAttribute.Intelligence] = 6.0;
      attributes[CombatAttribute.Focus] = 2.0;
      attributes[CombatAttribute.Vitality] = 1.5;
      attributes[CombatAttribute.Hp] = 4.5;
      attributes[CombatAttribute.Resilience] = 2.0;
      attributes[CombatAttribute.Agility] = 1.5;
      attributes[CombatAttribute.ArmorClass] = 2.5;

    case MonsterType.Cultist:
      attributes[CombatAttribute.Intelligence] = 8.0;
      attributes[CombatAttribute.Focus] = 2.0;
      attributes[CombatAttribute.Vitality] = 1.5;
      attributes[CombatAttribute.Hp] = 4.5;
      attributes[CombatAttribute.Resilience] = 2.0;
      attributes[CombatAttribute.Agility] = 1.5;
      attributes[CombatAttribute.ArmorClass] = 2.5;

    case MonsterType.FireElemental:
      attributes[CombatAttribute.Intelligence] = 6.0;
      attributes[CombatAttribute.Focus] = 2.0;
      attributes[CombatAttribute.Vitality] = 1.0;
      attributes[CombatAttribute.Hp] = 4.0;
      attributes[CombatAttribute.Resilience] = 2.0;
      attributes[CombatAttribute.Agility] = 1.5;

    case MonsterType.IceElemental:
      attributes[CombatAttribute.Intelligence] = 6.0;
      attributes[CombatAttribute.Focus] = 2.0;
      attributes[CombatAttribute.Vitality] = 1.0;
      attributes[CombatAttribute.Hp] = 4.0;
      attributes[CombatAttribute.Resilience] = 2.0;
      attributes[CombatAttribute.Agility] = 1.5;

    case MonsterType.MetallicGolem:
      attributes[CombatAttribute.Damage] = 3.0;
      attributes[CombatAttribute.Vitality] = 2.0;
      attributes[CombatAttribute.ArmorClass] = 15.0;
      attributes[CombatAttribute.Hp] = 9.5;
      attributes[CombatAttribute.Resilience] = 3.0;
      attributes[CombatAttribute.Agility] = 1.5;
  }

  return attributes;
}
