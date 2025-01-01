import { CombatantAbility, AbilityName, MonsterType } from "@speed-dungeon/common";

export default function getMonsterAbilities(
  monsterType: MonsterType
): Partial<Record<AbilityName, CombatantAbility>> {
  const abilities: Partial<Record<AbilityName, CombatantAbility>> = {};

  abilities[AbilityName.Attack] = CombatantAbility.createByName(AbilityName.Attack);
  abilities[AbilityName.AttackMeleeMainhand] = CombatantAbility.createByName(
    AbilityName.AttackMeleeMainhand
  );
  abilities[AbilityName.AttackMeleeOffhand] = CombatantAbility.createByName(
    AbilityName.AttackMeleeOffhand
  );
  abilities[AbilityName.AttackRangedMainhand] = CombatantAbility.createByName(
    AbilityName.AttackRangedMainhand
  );

  switch (monsterType) {
    case MonsterType.FireMage:
    case MonsterType.FireElemental:
      abilities[AbilityName.Fire] = CombatantAbility.createByName(AbilityName.Fire);
      break;
    case MonsterType.Cultist:
      abilities[AbilityName.Healing] = CombatantAbility.createByName(AbilityName.Healing);
      break;
    case MonsterType.IceElemental:
      abilities[AbilityName.Ice] = CombatantAbility.createByName(AbilityName.Ice);
      break;
    case MonsterType.MetallicGolem:
    case MonsterType.Zombie:
    case MonsterType.SkeletonArcher:
    case MonsterType.Scavenger:
    case MonsterType.Vulture:
  }

  return abilities;
}
