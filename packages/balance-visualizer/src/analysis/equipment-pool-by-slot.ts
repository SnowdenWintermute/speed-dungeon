import {
  EQUIPABLE_SLOTS_BY_EQUIPMENT_TYPE,
  Equipment,
  EquipmentSlotType,
  EquipmentType,
  invariant,
} from "@speed-dungeon/common";

/** What an item is worth to the character being measured. Accuracy availability scores by accuracy,
 * the damage study by marginal damage per turn — the slot rules are the same either way. */
export type EquipmentScore = (equipment: Equipment) => number;

/** Holdables cannot be filled slot by slot the way wearables can: a two-hander takes both hands and
 * a shield only fits one of them, so the hands are chosen as a set. */
enum HoldableCategory {
  TwoHanded,
  EitherHand,
  OffHandOnly,
}

/** Every dropped item, kept in the slot it could occupy, so loot can be read as what characters
 * would actually be wearing rather than as a sum over the whole pile. Selection returns what the
 * whole party wears, since a party of three competes for one pool; dividing that by the party is
 * the caller's decision, not this class's. */
export class EquipmentPoolBySlot {
  private readonly wearablesByType = new Map<EquipmentType, Equipment[]>();
  private readonly holdablesByCategory = new Map<HoldableCategory, Equipment[]>();

  add(equipment: Equipment) {
    const { equipmentType } = equipment.equipmentBaseItemProperties;

    const holdableCategory = EquipmentPoolBySlot.holdableCategoryOf(equipmentType);
    if (holdableCategory !== null) {
      EquipmentPoolBySlot.push(this.holdablesByCategory, holdableCategory, equipment);
      return;
    }
    EquipmentPoolBySlot.push(this.wearablesByType, equipmentType, equipment);
  }

  selectEquipped(characterCount: number, score: EquipmentScore): Equipment[] {
    return [
      ...this.selectEquippedWearables(characterCount, score),
      ...this.selectEquippedHoldables(characterCount, score),
    ];
  }

  selectEquippedWearables(characterCount: number, score: EquipmentScore): Equipment[] {
    invariant(characterCount > 0, "cannot equip a party of nobody");
    const selected: Equipment[] = [];

    for (const [equipmentType, candidates] of this.wearablesByType) {
      const slotsPerCharacter = EquipmentPoolBySlot.wearableSlotCount(equipmentType);
      selected.push(
        ...EquipmentPoolBySlot.descending(candidates, score).slice(
          0,
          slotsPerCharacter * characterCount
        )
      );
    }

    return selected;
  }

  /** Each character takes whichever pair of hands scores higher against what is left, so a
   * two-hander is only taken when it beats the best one-handed pairing rather than by default. */
  selectEquippedHoldables(characterCount: number, score: EquipmentScore): Equipment[] {
    invariant(characterCount > 0, "cannot equip a party of nobody");

    const twoHanded = this.descendingHoldables(HoldableCategory.TwoHanded, score);
    const eitherHand = this.descendingHoldables(HoldableCategory.EitherHand, score);
    const offHandOnly = this.descendingHoldables(HoldableCategory.OffHandOnly, score);
    const selected: Equipment[] = [];
    const scoreOf = (equipment: undefined | Equipment) =>
      equipment === undefined ? 0 : score(equipment);

    for (let character = 0; character < characterCount; character += 1) {
      const secondEitherHand = eitherHand[1];
      const bestOffHandOnly = offHandOnly[0];
      const offHand =
        scoreOf(secondEitherHand) >= scoreOf(bestOffHandOnly) ? secondEitherHand : bestOffHandOnly;

      const twoHandedScore = scoreOf(twoHanded[0]);
      const oneHandedScore = scoreOf(eitherHand[0]) + scoreOf(offHand);

      if (twoHandedScore <= 0 && oneHandedScore <= 0) {
        break;
      }

      if (twoHandedScore >= oneHandedScore) {
        selected.push(...twoHanded.splice(0, 1));
        continue;
      }

      selected.push(...eitherHand.splice(0, 1));
      if (offHand === undefined) {
        continue;
      }
      // the off hand was chosen before the main hand was removed, so a second one-hander has since
      // moved to the front of its own list
      selected.push(...(offHand === bestOffHandOnly ? offHandOnly : eitherHand).splice(0, 1));
    }

    return selected;
  }

  /** First pick, so no party division: the character being measured is assumed to get the best one
   * that dropped. */
  selectBestTwoHandedMelee(score: EquipmentScore): null | Equipment {
    const candidates = (this.holdablesByCategory.get(HoldableCategory.TwoHanded) ?? []).filter(
      (equipment) =>
        equipment.equipmentBaseItemProperties.equipmentType === EquipmentType.TwoHandedMeleeWeapon
    );

    return EquipmentPoolBySlot.descending(candidates, score)[0] ?? null;
  }

  private descendingHoldables(category: HoldableCategory, score: EquipmentScore) {
    return EquipmentPoolBySlot.descending(this.holdablesByCategory.get(category) ?? [], score);
  }

  private static push<TKey>(pools: Map<TKey, Equipment[]>, key: TKey, equipment: Equipment) {
    const pool = pools.get(key) ?? [];
    pool.push(equipment);
    pools.set(key, pool);
  }

  private static descending(candidates: Equipment[], score: EquipmentScore) {
    return [...candidates].sort((a, b) => score(b) - score(a));
  }

  /** Rings are the only type with two of them, and it is the equip table that says so. */
  private static wearableSlotCount(equipmentType: EquipmentType) {
    const { main, alternate } = EQUIPABLE_SLOTS_BY_EQUIPMENT_TYPE[equipmentType];
    return [main, alternate].filter((slot) => slot?.type === EquipmentSlotType.Wearable).length;
  }

  private static holdableCategoryOf(equipmentType: EquipmentType): null | HoldableCategory {
    const { main, alternate } = EQUIPABLE_SLOTS_BY_EQUIPMENT_TYPE[equipmentType];
    if (main.type !== EquipmentSlotType.Holdable) {
      return null;
    }
    if (Equipment.isTwoHandedWeaponType(equipmentType)) {
      return HoldableCategory.TwoHanded;
    }
    return alternate === null ? HoldableCategory.OffHandOnly : HoldableCategory.EitherHand;
  }
}
