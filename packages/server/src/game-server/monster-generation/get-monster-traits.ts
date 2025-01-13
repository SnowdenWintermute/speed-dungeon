import {
  CombatantTrait,
  CombatantTraitType,
  KineticDamageType,
  MagicalElement,
  MonsterType,
} from "@speed-dungeon/common";

export default function getMonsterTraits(monsterType: MonsterType): CombatantTrait[] {
  switch (monsterType) {
    case MonsterType.Zombie:
    case MonsterType.SkeletonArcher:
      return [
        {
          type: CombatantTraitType.ElementalAffinity,
          element: MagicalElement.Water,
          percent: -25,
        },
        { type: CombatantTraitType.Undead },
        {
          type: CombatantTraitType.KineticDamageTypeResistance,
          damageType: KineticDamageType.Blunt,
          percent: -25,
        },
        {
          type: CombatantTraitType.KineticDamageTypeResistance,
          damageType: KineticDamageType.Slashing,
          percent: 25,
        },
        {
          type: CombatantTraitType.KineticDamageTypeResistance,
          damageType: KineticDamageType.Piercing,
          percent: 50,
        },
      ];
    case MonsterType.Scavenger:
      return [
        {
          type: CombatantTraitType.KineticDamageTypeResistance,
          damageType: KineticDamageType.Blunt,
          percent: 50,
        },
        {
          type: CombatantTraitType.KineticDamageTypeResistance,
          damageType: KineticDamageType.Slashing,
          percent: -25,
        },
      ];
    case MonsterType.Vulture:
      return [
        {
          type: CombatantTraitType.KineticDamageTypeResistance,
          damageType: KineticDamageType.Blunt,
          percent: 50,
        },
        {
          type: CombatantTraitType.KineticDamageTypeResistance,
          damageType: KineticDamageType.Piercing,
          percent: -25,
        },
      ];
    case MonsterType.Cultist:
      return [
        {
          type: CombatantTraitType.ElementalAffinity,
          element: MagicalElement.Light,
          percent: 100,
        },
        {
          type: CombatantTraitType.ElementalAffinity,
          element: MagicalElement.Earth,
          percent: -75,
        },
      ];
    case MonsterType.FireElemental:
      return [
        {
          type: CombatantTraitType.KineticDamageTypeResistance,
          damageType: KineticDamageType.Blunt,
          percent: 50,
        },
        {
          type: CombatantTraitType.KineticDamageTypeResistance,
          damageType: KineticDamageType.Slashing,
          percent: 50,
        },
        {
          type: CombatantTraitType.KineticDamageTypeResistance,
          damageType: KineticDamageType.Piercing,
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
          type: CombatantTraitType.KineticDamageTypeResistance,
          damageType: KineticDamageType.Blunt,
          percent: 50,
        },
        {
          type: CombatantTraitType.KineticDamageTypeResistance,
          damageType: KineticDamageType.Slashing,
          percent: 50,
        },
        {
          type: CombatantTraitType.KineticDamageTypeResistance,
          damageType: KineticDamageType.Piercing,
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
      return [
        {
          type: CombatantTraitType.ElementalAffinity,
          element: MagicalElement.Fire,
          percent: 75,
        },
        {
          type: CombatantTraitType.ElementalAffinity,
          element: MagicalElement.Water,
          percent: -100,
        },
      ];
    case MonsterType.MetallicGolem:
      return [];
  }
}
