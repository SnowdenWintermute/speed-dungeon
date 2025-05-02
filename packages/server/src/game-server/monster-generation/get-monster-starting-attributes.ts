import { CombatAttribute, CombatantAttributeRecord, MonsterType } from "@speed-dungeon/common";

export function getMonsterStartingAttributes(monsterType: MonsterType): CombatantAttributeRecord {
  const attributes: CombatantAttributeRecord = {};
  switch (monsterType) {
    case MonsterType.MetallicGolem:
      attributes[CombatAttribute.Vitality] = 2.0;
      attributes[CombatAttribute.ArmorClass] = 15.0;
      attributes[CombatAttribute.Hp] = 7.5;
      attributes[CombatAttribute.Resilience] = 3.0;
      attributes[CombatAttribute.Accuracy] = 70.0;
      attributes[CombatAttribute.Strength] = 10.0;
      attributes[CombatAttribute.Speed] = 1.0;
      break;
    case MonsterType.Zombie:
      attributes[CombatAttribute.Strength] = 35.0;
      attributes[CombatAttribute.Dexterity] = 1.0;
      attributes[CombatAttribute.Vitality] = 2.0;
      attributes[CombatAttribute.Resilience] = 4.0;
      attributes[CombatAttribute.Hp] = 2.0;
      // TESTING
      attributes[CombatAttribute.Hp] = 150.0;
      //
      attributes[CombatAttribute.Agility] = 0.5;
      attributes[CombatAttribute.Accuracy] = 60.0;
      attributes[CombatAttribute.Speed] = 1.0;

      // testing
      // attributes[CombatAttribute.Dexterity] = 100.0;
      attributes[CombatAttribute.Vitality] = 6.0;
      // attributes[CombatAttribute.Evasion] = 100;
      break;
    case MonsterType.SkeletonArcher:
      attributes[CombatAttribute.Dexterity] = 10.0;
      attributes[CombatAttribute.Vitality] = 1.0;
      attributes[CombatAttribute.Hp] = 4.0;
      attributes[CombatAttribute.Speed] = 1.5;
      attributes[CombatAttribute.Accuracy] = 75.0;
      break;
    case MonsterType.Scavenger:
      // attributes[CombatAttribute.Dexterity] = 2.0;
      attributes[CombatAttribute.Dexterity] = 7.0;
      // attributes[CombatAttribute.Strength] = 200000.0;
      attributes[CombatAttribute.Strength] = 2.0;
      attributes[CombatAttribute.Vitality] = 1.5;
      attributes[CombatAttribute.Hp] = 1.0;
      // TESTING
      attributes[CombatAttribute.Hp] = 150.0;
      // attributes[CombatAttribute.Agility] = 1.0;
      attributes[CombatAttribute.Agility] = 2.0;
      attributes[CombatAttribute.Accuracy] = 80.0;
      break;
    case MonsterType.Vulture:
      attributes[CombatAttribute.Dexterity] = 2.5;
      attributes[CombatAttribute.Strength] = 2;
      attributes[CombatAttribute.Vitality] = 1.5;
      attributes[CombatAttribute.Hp] = 4.0;
      attributes[CombatAttribute.Accuracy] = 80.0;
      attributes[CombatAttribute.Speed] = 1.0;
      break;
    case MonsterType.FireMage:
      attributes[CombatAttribute.Intelligence] = 4.0;
      attributes[CombatAttribute.Focus] = 2.0;
      attributes[CombatAttribute.Vitality] = 1.5;
      attributes[CombatAttribute.Hp] = 3.0;
      attributes[CombatAttribute.Resilience] = 2.0;
      attributes[CombatAttribute.Accuracy] = 60.0;
      attributes[CombatAttribute.Speed] = 1.0;
      break;
    case MonsterType.Cultist:
      attributes[CombatAttribute.Intelligence] = 6.0;
      attributes[CombatAttribute.Hp] = 45.0;
      // attributes[CombatAttribute.Hp] = 10.0;
      attributes[CombatAttribute.Vitality] = 1.5;
      attributes[CombatAttribute.Resilience] = 2.0;
      // attributes[CombatAttribute.Strength] = 30; // @TESTING remove
      // attributes[CombatAttribute.Accuracy] = 60.0;
      attributes[CombatAttribute.Accuracy] = 600.0;
      attributes[CombatAttribute.Speed] = 1.0;
      // attributes[CombatAttribute.Speed] = 10.0;
      break;
    case MonsterType.FireElemental:
      attributes[CombatAttribute.Intelligence] = 4.0;
      attributes[CombatAttribute.Focus] = 2.0;
      attributes[CombatAttribute.Vitality] = 1.0;
      attributes[CombatAttribute.Hp] = 3.0;
      attributes[CombatAttribute.Resilience] = 2.0;
      attributes[CombatAttribute.Accuracy] = 60.0;
      attributes[CombatAttribute.Speed] = 1.0;
      break;
    case MonsterType.IceElemental:
      attributes[CombatAttribute.Intelligence] = 4.0;
      attributes[CombatAttribute.Focus] = 2.0;
      attributes[CombatAttribute.Vitality] = 1.0;
      attributes[CombatAttribute.Hp] = 3.0;
      attributes[CombatAttribute.Resilience] = 2.0;
      attributes[CombatAttribute.Accuracy] = 60.0;
      attributes[CombatAttribute.Speed] = 1.0;
      break;
  }

  return attributes;
}
