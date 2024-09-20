import { CombatantAbility, CombatantAbilityName } from "../combatants/index.js";
import { MonsterType } from "./monster-types.js";

export default function getMonsterAbilities(
  monsterType: MonsterType
): Partial<Record<CombatantAbilityName, CombatantAbility>> {
  const abilities: Partial<Record<CombatantAbilityName, CombatantAbility>> = {};

  abilities[CombatantAbilityName.Attack] = CombatantAbility.createByName(
    CombatantAbilityName.Attack
  );
  abilities[CombatantAbilityName.AttackMeleeMainhand] = CombatantAbility.createByName(
    CombatantAbilityName.AttackMeleeMainhand
  );
  abilities[CombatantAbilityName.AttackMeleeOffhand] = CombatantAbility.createByName(
    CombatantAbilityName.AttackMeleeOffhand
  );
  abilities[CombatantAbilityName.AttackRangedMainhand] = CombatantAbility.createByName(
    CombatantAbilityName.AttackRangedMainhand
  );

  switch (monsterType) {
    case MonsterType.FireMage:
    case MonsterType.FireElemental:
      abilities[CombatantAbilityName.Fire] = CombatantAbility.createByName(
        CombatantAbilityName.Fire
      );
      break;
    case MonsterType.Cultist:
      abilities[CombatantAbilityName.Healing] = CombatantAbility.createByName(
        CombatantAbilityName.Healing
      );
      break;
    case MonsterType.IceElemental:
      abilities[CombatantAbilityName.Ice] = CombatantAbility.createByName(CombatantAbilityName.Ice);
      break;
    case MonsterType.MetallicGolem:
    case MonsterType.Zombie:
    case MonsterType.SkeletonArcher:
    case MonsterType.Scavenger:
    case MonsterType.Vulture:
  }

  return abilities;
}
