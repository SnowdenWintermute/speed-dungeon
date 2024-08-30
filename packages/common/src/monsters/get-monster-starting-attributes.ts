import { CombatAttribute, CombatantAttributeRecord } from "../combatants";
import { MonsterType } from "./monster-types";

export default function getMonsterStartingAttributes(
  monsterType: MonsterType
): CombatantAttributeRecord {
  const attributes: CombatantAttributeRecord = {};
  switch (monsterType) {
    case MonsterType.MetallicGolem:
      attributes[CombatAttribute.Damage] = 3.0;
      attributes[CombatAttribute.Vitality] = 2.0;
      attributes[CombatAttribute.ArmorClass] = 15.0;
      attributes[CombatAttribute.Hp] = 7.5;
      attributes[CombatAttribute.Resilience] = 3.0;
      attributes[CombatAttribute.Accuracy] = 70.0;
      break;
    case MonsterType.Zombie:
      attributes[CombatAttribute.Damage] = 0.0;
      attributes[CombatAttribute.Strength] = 3.0;
      attributes[CombatAttribute.Dexterity] = 1.0;
      attributes[CombatAttribute.Vitality] = 2.0;
      attributes[CombatAttribute.Hp] = 50.0;
      attributes[CombatAttribute.Agility] = 0.5;
      attributes[CombatAttribute.Accuracy] = 60.0;
      attributes[CombatAttribute.Speed] = 1.0;
      break;
    case MonsterType.SkeletonArcher:
      attributes[CombatAttribute.Damage] = 0.0;
      attributes[CombatAttribute.Dexterity] = 3.0;
      attributes[CombatAttribute.Vitality] = 1.0;
      attributes[CombatAttribute.Hp] = 4.0;
      attributes[CombatAttribute.Accuracy] = 75.0;
      break;
    case MonsterType.Scavenger:
      attributes[CombatAttribute.Damage] = 0.0;
      attributes[CombatAttribute.Dexterity] = 2.0;
      attributes[CombatAttribute.Strength] = 2.0;
      attributes[CombatAttribute.Vitality] = 1.5;
      attributes[CombatAttribute.Hp] = 40.0;
      attributes[CombatAttribute.Agility] = 2.0;
      attributes[CombatAttribute.Accuracy] = 80.0;
      break;
    case MonsterType.Vulture:
      attributes[CombatAttribute.Damage] = 0.0;
      attributes[CombatAttribute.Dexterity] = 2.5;
      attributes[CombatAttribute.Strength] = 1.5;
      attributes[CombatAttribute.Vitality] = 1.5;
      attributes[CombatAttribute.Hp] = 4.0;
      attributes[CombatAttribute.Accuracy] = 80.0;
      break;
    case MonsterType.FireMage:
      attributes[CombatAttribute.Damage] = 1.0;
      attributes[CombatAttribute.Intelligence] = 4.0;
      attributes[CombatAttribute.Focus] = 2.0;
      attributes[CombatAttribute.Vitality] = 1.5;
      attributes[CombatAttribute.Hp] = 3.0;
      attributes[CombatAttribute.Resilience] = 2.0;
      attributes[CombatAttribute.Accuracy] = 60.0;
      attributes[CombatAttribute.Speed] = 1.0;
      break;
    case MonsterType.Cultist:
      attributes[CombatAttribute.Damage] = 1.0;
      attributes[CombatAttribute.Intelligence] = 4.0;
      attributes[CombatAttribute.Hp] = 3.0;
      attributes[CombatAttribute.Vitality] = 1.5;
      attributes[CombatAttribute.Hp] = 1.5;
      attributes[CombatAttribute.Resilience] = 2.0;
      attributes[CombatAttribute.Accuracy] = 60.0;
      break;
    case MonsterType.FireElemental:
      attributes[CombatAttribute.Damage] = 2.0;
      attributes[CombatAttribute.Intelligence] = 4.0;
      attributes[CombatAttribute.Focus] = 2.0;
      attributes[CombatAttribute.Vitality] = 1.0;
      attributes[CombatAttribute.Hp] = 3.0;
      attributes[CombatAttribute.Resilience] = 2.0;
      attributes[CombatAttribute.Accuracy] = 60.0;
      break;
    case MonsterType.IceElemental:
      attributes[CombatAttribute.Damage] = 2.0;
      attributes[CombatAttribute.Intelligence] = 4.0;
      attributes[CombatAttribute.Focus] = 2.0;
      attributes[CombatAttribute.Vitality] = 1.0;
      attributes[CombatAttribute.Hp] = 3.0;
      attributes[CombatAttribute.Resilience] = 2.0;
      attributes[CombatAttribute.Accuracy] = 60.0;
      break;
  }

  return attributes;
}
