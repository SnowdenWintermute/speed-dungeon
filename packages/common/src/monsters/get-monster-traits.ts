import { MagicalElement, PhysicalDamageType } from "../combat";
import { CombatantTrait, CombatantTraitType } from "../combatants";
import { MonsterType } from "./monster-types";

export default function getMonsterTraits(monsterType: MonsterType): CombatantTrait[] {
  switch (monsterType) {
    case MonsterType.Zombie:
    case MonsterType.SkeletonArcher:
      return [
        { type: CombatantTraitType.Undead },
        {
          type: CombatantTraitType.PhysicalDamageTypeResistance,
          damageType: PhysicalDamageType.Blunt,
          percent: -25,
        },
        {
          type: CombatantTraitType.PhysicalDamageTypeResistance,
          damageType: PhysicalDamageType.Slashing,
          percent: 25,
        },
        {
          type: CombatantTraitType.PhysicalDamageTypeResistance,
          damageType: PhysicalDamageType.Piercing,
          percent: 50,
        },
      ];
    case MonsterType.Scavenger:
      return [
        {
          type: CombatantTraitType.PhysicalDamageTypeResistance,
          damageType: PhysicalDamageType.Blunt,
          percent: 50,
        },
        {
          type: CombatantTraitType.PhysicalDamageTypeResistance,
          damageType: PhysicalDamageType.Slashing,
          percent: -25,
        },
      ];
    case MonsterType.Vulture:
      return [
        {
          type: CombatantTraitType.PhysicalDamageTypeResistance,
          damageType: PhysicalDamageType.Blunt,
          percent: 50,
        },
        {
          type: CombatantTraitType.PhysicalDamageTypeResistance,
          damageType: PhysicalDamageType.Piercing,
          percent: -25,
        },
      ];
    case MonsterType.Cultist:
      return [];
    case MonsterType.FireElemental:
      return [
        {
          type: CombatantTraitType.PhysicalDamageTypeResistance,
          damageType: PhysicalDamageType.Blunt,
          percent: 50,
        },
        {
          type: CombatantTraitType.PhysicalDamageTypeResistance,
          damageType: PhysicalDamageType.Slashing,
          percent: 50,
        },
        {
          type: CombatantTraitType.PhysicalDamageTypeResistance,
          damageType: PhysicalDamageType.Piercing,
          percent: 50,
        },
        {
          type: CombatantTraitType.ElementalAffinity,
          element: MagicalElement.Fire,
          percent: 200,
        },
        {
          type: CombatantTraitType.ElementalAffinity,
          element: MagicalElement.Ice,
          percent: -100,
        },
      ];
    case MonsterType.IceElemental:
      return [
        {
          type: CombatantTraitType.PhysicalDamageTypeResistance,
          damageType: PhysicalDamageType.Blunt,
          percent: 50,
        },
        {
          type: CombatantTraitType.PhysicalDamageTypeResistance,
          damageType: PhysicalDamageType.Slashing,
          percent: 50,
        },
        {
          type: CombatantTraitType.PhysicalDamageTypeResistance,
          damageType: PhysicalDamageType.Piercing,
          percent: 50,
        },
        {
          type: CombatantTraitType.ElementalAffinity,
          element: MagicalElement.Fire,
          percent: -100,
        },
        {
          type: CombatantTraitType.ElementalAffinity,
          element: MagicalElement.Ice,
          percent: 200,
        },
      ];
    case MonsterType.FireMage:
      return [];
    case MonsterType.MetallicGolem:
      return [];
  }
}
