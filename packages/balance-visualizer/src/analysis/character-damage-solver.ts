import {
  CombatAttribute,
  Combatant,
  EQUIPABLE_SLOTS_BY_EQUIPMENT_TYPE,
  Equipment,
  EquipmentSlotType,
  EquipmentType,
  HoldableSlotType,
  invariant,
  iterateNumericEnumKeyedRecord,
  WearableSlotType,
} from "@speed-dungeon/common";
import cloneDeep from "lodash.clonedeep";
import { DamagePerTurnCalculator } from "../metrics/damage-per-turn";
import { ArchetypeProfile, HoldableConfiguration } from "./character-archetype";
import { EquipmentDamageSources } from "./equipment-damage-sources";
import { LoadoutFrontier, PartialLoadout } from "./loadout-frontier";
import { DominanceProfile, pruneDominated } from "./pareto-prune";

function wearableSlotsOf(equipmentType: EquipmentType): WearableSlotType[] {
  const { main, alternate } = EQUIPABLE_SLOTS_BY_EQUIPMENT_TYPE[equipmentType];
  const wearable: WearableSlotType[] = [];

  for (const slot of [main, alternate]) {
    if (slot !== null && slot.type === EquipmentSlotType.Wearable) {
      wearable.push(slot.slot);
    }
  }

  return wearable;
}

/** Derived rather than listed, so a new wearable type or a second amulet slot needs no edit here.
 * Rings come out with two slots because the equip table says a ring fits either hand. */
const WEARABLE_EQUIPMENT_TYPES = iterateNumericEnumKeyedRecord(EQUIPABLE_SLOTS_BY_EQUIPMENT_TYPE)
  .map(([equipmentType]) => equipmentType)
  .filter((equipmentType) => wearableSlotsOf(equipmentType).length > 0);

interface Hands {
  mainHand: null | Equipment;
  offHand: null | Equipment;
}

export interface SolvedLoadout {
  damagePerTurn: number;
  pointsIntoStrength: number;
  hands: Hands;
  wearables: Equipment[];
}

/** The best damage per turn a character could reach right now: the best equipment they could be
 * wearing out of what has dropped, together with the attribute allocation that equipment deserves.
 *
 * Both halves have to be solved together. Equipment changes what an attribute point is worth — a
 * two-hander with a Strength requirement forces points that a bow would not — and the allocation
 * changes which equipment is even wearable. Solving either alone gets the other wrong. */
export class CharacterDamageSolver {
  constructor(private readonly damagePerTurn: DamagePerTurnCalculator) {}

  solve(
    character: Combatant,
    target: Combatant,
    available: Equipment[],
    profile: ArchetypeProfile
  ): SolvedLoadout {
    const byType = CharacterDamageSolver.groupByType(available);
    let best: null | SolvedLoadout = null;

    for (const hands of CharacterDamageSolver.enumerateHands(byType, profile)) {
      const held = [hands.mainHand, hands.offHand].filter((item) => item !== null);
      const frontier = new LoadoutFrontier();

      for (const equipmentType of WEARABLE_EQUIPMENT_TYPES) {
        const candidates = (byType.get(equipmentType) ?? []).filter(
          (candidate) => !held.includes(candidate)
        );
        frontier.fillSlots(candidates, wearableSlotsOf(equipmentType).length);
      }

      for (const state of frontier.getStates()) {
        const solved = this.bestAllocationFor(character, target, hands, state, profile);
        if (best === null || solved.damagePerTurn > best.damagePerTurn) {
          best = solved;
        }
      }
    }

    invariant(best !== null, "no loadout was considered, not even the empty one");
    return best;
  }

  /** Only Strength and Dexterity reach a basic attack: Spirit buys magic points and magical damage
   * reduction, Vitality buys hit points and crit damage reduction, Agility buys evasion and speed.
   * So the allocation is one number — how the points divide between the two — and every value of it
   * is enumerated rather than reasoned about, because which attribute pays depends on the action.
   * A melee attack scales damage on Strength, takes crit chance from Strength and Dexterity both,
   * and its crit multiplier from Strength; a bow scales damage on Dexterity, takes crit chance from
   * Dexterity alone, and has a flat crit multiplier no attribute touches. So Strength buys a bow
   * user nothing but the right to hold their gear, while for a melee character the best split moves
   * with the target's evasion and is not even monotone in it — Dexterity's accuracy half stops
   * paying once the hit chance clamps at 1, leaving only its crit chance.
   *
   * A split that cannot afford an item's requirement needs no special case. getCombatantTotalAttributes
   * strips an unmet item's contribution and getWeaponsInSlots drops an unusable weapon, so the
   * character swings unarmed and the split scores badly through the real rules. */
  private bestAllocationFor(
    character: Combatant,
    target: Combatant,
    hands: Hands,
    wearables: PartialLoadout,
    profile: ArchetypeProfile
  ): SolvedLoadout {
    const clone = CharacterDamageSolver.wearing(character, hands, wearables.items);
    const { attributeProperties } = clone.combatantProperties;
    const points = attributeProperties.getUnspentPoints();

    const natural = attributeProperties.getNaturalAttributes();
    const baseStrength = natural[CombatAttribute.Strength] ?? 0;
    const baseDexterity = natural[CombatAttribute.Dexterity] ?? 0;

    if (profile.forcedAllocationAttribute !== null) {
      const forced = profile.forcedAllocationAttribute;
      attributeProperties.setSpeccedAttributeValue(forced, (natural[forced] ?? 0) + points);
      return {
        damagePerTurn: this.damagePerTurn.against(clone, target),
        pointsIntoStrength: 0,
        hands,
        wearables: wearables.items,
      };
    }

    let best = { damagePerTurn: -Infinity, pointsIntoStrength: 0 };

    for (let intoStrength = 0; intoStrength <= points; intoStrength += 1) {
      attributeProperties.setSpeccedAttributeValue(
        CombatAttribute.Strength,
        baseStrength + intoStrength
      );
      attributeProperties.setSpeccedAttributeValue(
        CombatAttribute.Dexterity,
        baseDexterity + points - intoStrength
      );

      const damagePerTurn = this.damagePerTurn.against(clone, target);
      if (damagePerTurn > best.damagePerTurn) {
        best = { damagePerTurn, pointsIntoStrength: intoStrength };
      }
    }

    return { ...best, hands, wearables: wearables.items };
  }

  private static wearing(character: Combatant, hands: Hands, wearables: Equipment[]) {
    const clone = cloneDeep(character);
    const { equipment } = clone.combatantProperties;

    if (hands.mainHand !== null) {
      equipment.putEquipmentInSlot(cloneDeep(hands.mainHand), {
        type: EquipmentSlotType.Holdable,
        slot: HoldableSlotType.MainHand,
      });
    }
    if (hands.offHand !== null) {
      equipment.putEquipmentInSlot(cloneDeep(hands.offHand), {
        type: EquipmentSlotType.Holdable,
        slot: HoldableSlotType.OffHand,
      });
    }

    const wornPerType = new Map<EquipmentType, number>();

    for (const wearable of wearables) {
      const { equipmentType } = wearable.equipmentBaseItemProperties;
      const alreadyWorn = wornPerType.get(equipmentType) ?? 0;
      const slot = wearableSlotsOf(equipmentType)[alreadyWorn];
      invariant(slot !== undefined, "a wearable was chosen for a slot that does not exist");
      wornPerType.set(equipmentType, alreadyWorn + 1);

      equipment.putEquipmentInSlot(cloneDeep(wearable), {
        type: EquipmentSlotType.Wearable,
        slot,
      });
    }

    return clone;
  }

  private static enumerateHands(
    byType: Map<EquipmentType, Equipment[]>,
    profile: ArchetypeProfile
  ): Hands[] {
    // pruned before pairing, not after: dual wield pairs the one-handed pool with itself, so every
    // weapon that survives multiplies the work by the size of the whole pool again
    const holdables = (equipmentType: EquipmentType) =>
      pruneDominated(byType.get(equipmentType) ?? [], CharacterDamageSolver.weaponDominanceOf);

    const twoHandedMelee = holdables(EquipmentType.TwoHandedMeleeWeapon);
    const twoHandedRanged = holdables(EquipmentType.TwoHandedRangedWeapon);
    const oneHanded = holdables(EquipmentType.OneHandedMeleeWeapon);
    const shields = holdables(EquipmentType.Shield);

    const bothHands = (weapons: Equipment[]) =>
      weapons.map((mainHand) => ({ mainHand, offHand: null }));
    const pairs = (mains: Equipment[], offs: Equipment[]) =>
      mains.flatMap((mainHand) =>
        offs
          .filter((offHand) => offHand !== mainHand)
          .map((offHand) => ({ mainHand, offHand }))
      );

    switch (profile.holdableConfiguration) {
      case HoldableConfiguration.TwoHandedMelee:
        return bothHands(twoHandedMelee);
      case HoldableConfiguration.TwoHandedRanged:
        return bothHands(twoHandedRanged);
      case HoldableConfiguration.DualWield:
        return pairs(oneHanded, oneHanded);
      case HoldableConfiguration.OneHandAndShield:
        return pairs(oneHanded, shields);
      case HoldableConfiguration.Unconstrained:
        return [
          ...bothHands(twoHandedMelee),
          ...bothHands(twoHandedRanged),
          ...pairs(oneHanded, oneHanded),
          ...pairs(oneHanded, shields),
          ...oneHanded.map((mainHand) => ({ mainHand, offHand: null })),
          { mainHand: null, offHand: null },
        ];
    }
  }

  /** A weapon carries its own damage range on top of the attributes any item can carry, so it gets
   * two more benefit axes than a wearable does. Both hands prune against one profile because the
   * off-hand modifiers scale everything down uniformly — a weapon that dominates another in the
   * main hand dominates it in the off hand too, so the surviving set is the same either way.
   *
   * Damage classification is deliberately not an axis. It only matters against a target with
   * resistances, and this study's target has none; give the dummy resistances and this needs one
   * axis per damage type or the prune stops being lossless. */
  private static weaponDominanceOf(weapon: Equipment): DominanceProfile {
    const { strength, dexterity, accuracy, flatDamage } = EquipmentDamageSources.of(weapon);
    const weaponProperties = weapon.getWeaponProperties();
    const damage =
      weaponProperties instanceof Error
        ? { min: 0, max: 0 }
        : Equipment.getModifiedWeaponDamageRange(weapon.affixes, weaponProperties.damage);

    return {
      benefits: [strength, dexterity, accuracy, flatDamage, damage.min, damage.max],
      demands: weapon.requirements,
    };
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
