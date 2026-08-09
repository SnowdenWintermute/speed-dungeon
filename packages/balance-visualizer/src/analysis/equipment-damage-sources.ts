import { CombatAttribute, Equipment } from "@speed-dungeon/common";

/** What a non-weapon item contributes to a two-handed melee attacker's damage. Kept as the four raw
 * quantities rather than one number because each buys damage through a different channel and the
 * exchange rate between them moves with the target's evasion — collapsing them early is exactly the
 * mistake that hides the falloff. */
export interface DamageSources {
  strength: number;
  dexterity: number;
  accuracy: number;
  /** Only non-weapon flat damage: a weapon's own flat damage suffix is applied inside its own
   * damage range with its percent-damage multiplier, and is counted with the weapon. */
  flatDamage: number;
}

export const NO_DAMAGE_SOURCES: DamageSources = {
  strength: 0,
  dexterity: 0,
  accuracy: 0,
  flatDamage: 0,
};

export class EquipmentDamageSources {
  static of(equipment: Equipment): DamageSources {
    let strength = 0;
    let dexterity = 0;
    let accuracy = 0;

    const affixAttributes = equipment.iterateAffixes().map((affix) => affix.combatAttributes);
    for (const attributes of [equipment.attributes, ...affixAttributes]) {
      strength += attributes[CombatAttribute.Strength] ?? 0;
      dexterity += attributes[CombatAttribute.Dexterity] ?? 0;
      accuracy += attributes[CombatAttribute.Accuracy] ?? 0;
    }

    return {
      strength,
      dexterity,
      accuracy,
      flatDamage: equipment.isWeapon() ? 0 : equipment.getFlatDamageBonus(),
    };
  }

  static sum(sources: DamageSources[]): DamageSources {
    return sources.reduce(
      (accumulated, current) => ({
        strength: accumulated.strength + current.strength,
        dexterity: accumulated.dexterity + current.dexterity,
        accuracy: accumulated.accuracy + current.accuracy,
        flatDamage: accumulated.flatDamage + current.flatDamage,
      }),
      NO_DAMAGE_SOURCES
    );
  }

  static scale(sources: DamageSources, factor: number): DamageSources {
    return {
      strength: sources.strength * factor,
      dexterity: sources.dexterity * factor,
      accuracy: sources.accuracy * factor,
      flatDamage: sources.flatDamage * factor,
    };
  }

  /** The average of a weapon's damage range after its own affixes, which is how a two-hander is
   * ranked for first pick. TWO_HANDED_WEAPON_AFFIX_VALUE_MULTIPILER is already baked into the affix
   * values by the time an item exists, so nothing here has to know about it. */
  static weaponDamageAverage(equipment: Equipment): number {
    const weaponProperties = equipment.getWeaponProperties();
    if (weaponProperties instanceof Error) {
      return 0;
    }
    const range = Equipment.getModifiedWeaponDamageRange(
      equipment.affixes,
      weaponProperties.damage
    );
    return (range.min + range.max) / 2;
  }
}
