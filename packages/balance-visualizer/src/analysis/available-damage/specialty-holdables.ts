import { Equipment, EquipmentType } from "@speed-dungeon/common";
import cloneDeep from "lodash.clonedeep";
import {
  DamageSources,
  EquipmentDamageSources,
  NO_DAMAGE_SOURCES,
} from "../equipment-damage-sources";
import { HoldableConfiguration } from "../character-archetype";
import { POINTS_PER_BUDGET_UNIT } from "./gear-budget";

export interface Holdables {
  mainHand: null | Equipment;
  offHand: null | Equipment;
}

/** What the specialist ends up holding, once everything on it that is not damage has been taken off
 * and handed to the gear budget. */
export interface StrippedHoldables {
  holdables: Holdables;
  movedToBudget: DamageSources;
}

/** The measured character gets first pick, so no division by the party: unlike a body armor slot,
 * which every character fills, a two-hander is what the one character specializing in two-handers
 * would be carrying. Nobody else in the party is assumed to want it. */
/** The weapon types a specialty is measured on. Unconstrained names them all, since a caster is not
 * defined by what it holds. */
const WEAPON_TYPES_BY_CONFIGURATION: Record<HoldableConfiguration, EquipmentType[]> = {
  [HoldableConfiguration.TwoHandedMelee]: [EquipmentType.TwoHandedMeleeWeapon],
  [HoldableConfiguration.TwoHandedRanged]: [EquipmentType.TwoHandedRangedWeapon],
  [HoldableConfiguration.DualWield]: [EquipmentType.OneHandedMeleeWeapon],
  [HoldableConfiguration.OneHandAndShield]: [EquipmentType.OneHandedMeleeWeapon],
  [HoldableConfiguration.Unconstrained]: [
    EquipmentType.OneHandedMeleeWeapon,
    EquipmentType.TwoHandedMeleeWeapon,
    EquipmentType.TwoHandedRangedWeapon,
  ],
};

export class SpecialtyHoldables {
  static weaponCandidates(configuration: HoldableConfiguration, available: Equipment[]) {
    const weaponTypes = WEAPON_TYPES_BY_CONFIGURATION[configuration];
    return available.filter((equipment) =>
      weaponTypes.includes(equipment.equipmentBaseItemProperties.equipmentType)
    );
  }

  /** Null when the specialty's weapon has not dropped yet. Not the same as fighting unarmed — the
   * caller records the room as one where the specialty was unavailable rather than scoring it,
   * because a bow user with no bow is measuring the drop rate, not the bow. */
  static bestFor(
    configuration: HoldableConfiguration,
    available: Equipment[]
  ): null | Holdables {
    const byType = SpecialtyHoldables.groupByType(available);
    const bestByDamage = (equipmentType: EquipmentType) =>
      SpecialtyHoldables.descending(
        byType.get(equipmentType) ?? [],
        EquipmentDamageSources.weaponDamageAverage
      );

    switch (configuration) {
      case HoldableConfiguration.TwoHandedMelee:
        return SpecialtyHoldables.mainHandOnly(bestByDamage(EquipmentType.TwoHandedMeleeWeapon));
      case HoldableConfiguration.TwoHandedRanged:
        return SpecialtyHoldables.mainHandOnly(bestByDamage(EquipmentType.TwoHandedRangedWeapon));
      case HoldableConfiguration.DualWield: {
        const [mainHand, offHand] = bestByDamage(EquipmentType.OneHandedMeleeWeapon);
        // one weapon and a free hand still swings twice, the off hand unarmed
        return mainHand === undefined ? null : { mainHand, offHand: offHand ?? null };
      }
      case HoldableConfiguration.OneHandAndShield: {
        const [mainHand] = bestByDamage(EquipmentType.OneHandedMeleeWeapon);
        if (mainHand === undefined) {
          return null;
        }
        // a shield deals no damage, so it is picked for what it carries instead
        const [offHand] = SpecialtyHoldables.descending(
          byType.get(EquipmentType.Shield) ?? [],
          SpecialtyHoldables.offensiveValueInBudgetUnits
        );
        return { mainHand, offHand: offHand ?? null };
      }
      case HoldableConfiguration.Unconstrained:
        // a caster's hands are not the point of measuring one, so it takes whatever hits hardest
        return SpecialtyHoldables.mainHandOnly(
          SpecialtyHoldables.descending(
            available.filter((equipment) => equipment.isWeapon()),
            EquipmentDamageSources.weaponDamageAverage
          )
        );
    }
  }

  /** A weapon is chosen for its damage, so its damage is all it keeps. Everything else it rolled
   * goes into the gear budget, where the character spends it on whatever pays best — a strength
   * suffix on a bow is not strength a bow user is stuck with, it is strength the loot table made
   * available to them. Two-handers get their affix values doubled at generation, so this is also
   * where that shows up as a real advantage rather than as whichever attribute the roll landed on.
   *
   * The damage affixes are baked into the base range on the way out, because they are the damage:
   * getModifiedWeaponDamageRange is what percent and flat damage act through, and it reads the
   * affixes that are about to be deleted. Everything downstream then sees a plain weapon whose range
   * already includes them, which is also what the weapon was ranked on. */
  static withAffixesMovedToBudget(holdables: Holdables): StrippedHoldables {
    const mainHand = SpecialtyHoldables.strip(holdables.mainHand);
    const offHand = SpecialtyHoldables.strip(holdables.offHand);

    return {
      holdables: { mainHand: mainHand.stripped, offHand: offHand.stripped },
      movedToBudget: EquipmentDamageSources.sum([mainHand.movedToBudget, offHand.movedToBudget]),
    };
  }

  private static strip(equipment: null | Equipment) {
    if (equipment === null) {
      return { stripped: null, movedToBudget: NO_DAMAGE_SOURCES };
    }

    const movedToBudget = EquipmentDamageSources.of(equipment);
    const stripped = cloneDeep(equipment);

    const weaponProperties = stripped.getWeaponProperties();
    if (!(weaponProperties instanceof Error)) {
      weaponProperties.damage = Equipment.getModifiedWeaponDamageRange(
        stripped.affixes,
        weaponProperties.damage
      );
    }

    stripped.affixes = {};
    stripped.attributes = {};

    return { stripped, movedToBudget };
  }

  private static offensiveValueInBudgetUnits(equipment: Equipment) {
    const sources = EquipmentDamageSources.of(equipment);
    return (
      sources.strength +
      sources.dexterity +
      sources.accuracy / POINTS_PER_BUDGET_UNIT.accuracy +
      sources.flatDamage / POINTS_PER_BUDGET_UNIT.flatDamage
    );
  }

  private static mainHandOnly(descending: Equipment[]): null | Holdables {
    const [mainHand] = descending;
    return mainHand === undefined ? null : { mainHand, offHand: null };
  }

  private static descending(candidates: Equipment[], score: (equipment: Equipment) => number) {
    return [...candidates].sort((a, b) => score(b) - score(a));
  }

  private static groupByType(available: Equipment[]) {
    const byType = new Map<EquipmentType, Equipment[]>();
    for (const equipment of available) {
      const { equipmentType } = equipment.equipmentBaseItemProperties;
      const group = byType.get(equipmentType) ?? [];
      group.push(equipment);
      byType.set(equipmentType, group);
    }
    return byType;
  }
}
