import {
  BaseItemTypeOf,
  Equipment,
  EquipmentBaseItem,
  EquipmentBaseItemOfType,
  EquipmentType,
  iterateNumericEnum,
} from "@speed-dungeon/common";

interface TalliedBaseItem<K extends EquipmentType> {
  baseItem: EquipmentBaseItemOfType<K>;
  count: number;
}

/**
 * The base item is stored alongside its count rather than rebuilt from the key on read: an
 * EquipmentBaseItem assembled from a generically indexed pair loses the discriminant correlation
 * and no longer typechecks.
 */
type CountsByEquipmentType = {
  [K in EquipmentType]: Map<BaseItemTypeOf<K>, TalliedBaseItem<K>>;
};

export class EquipmentBaseItemTally {
  private constructor(private countsByEquipmentType: CountsByEquipmentType) {}

  private static counts(source?: CountsByEquipmentType): CountsByEquipmentType {
    return {
      [EquipmentType.BodyArmor]: new Map(source?.[EquipmentType.BodyArmor]),
      [EquipmentType.HeadGear]: new Map(source?.[EquipmentType.HeadGear]),
      [EquipmentType.Ring]: new Map(source?.[EquipmentType.Ring]),
      [EquipmentType.Amulet]: new Map(source?.[EquipmentType.Amulet]),
      [EquipmentType.OneHandedMeleeWeapon]: new Map(source?.[EquipmentType.OneHandedMeleeWeapon]),
      [EquipmentType.TwoHandedMeleeWeapon]: new Map(source?.[EquipmentType.TwoHandedMeleeWeapon]),
      [EquipmentType.TwoHandedRangedWeapon]: new Map(source?.[EquipmentType.TwoHandedRangedWeapon]),
      [EquipmentType.Shield]: new Map(source?.[EquipmentType.Shield]),
    };
  }

  static empty() {
    return new EquipmentBaseItemTally(EquipmentBaseItemTally.counts());
  }

  private increment<K extends EquipmentType>(
    equipmentType: K,
    baseItemType: BaseItemTypeOf<K>,
    baseItem: EquipmentBaseItemOfType<K>,
    amount: number
  ) {
    const counts = this.countsByEquipmentType[equipmentType];
    const tallied = counts.get(baseItemType);
    if (tallied === undefined) {
      counts.set(baseItemType, { baseItem, count: amount });
    } else {
      tallied.count += amount;
    }
  }

  add(baseItem: EquipmentBaseItem) {
    this.increment(baseItem.equipmentType, baseItem.baseItemType, baseItem, 1);
  }

  addAllEquipment(equipment: Iterable<Equipment>) {
    for (const item of equipment) {
      this.add(item.equipmentBaseItemProperties);
    }
  }

  /** snapshots a running tally, so a room keeps what was available as of that room */
  clone() {
    const cloned = EquipmentBaseItemTally.empty();
    for (const { baseItem, count } of this.allEntries()) {
      cloned.increment(baseItem.equipmentType, baseItem.baseItemType, baseItem, count);
    }
    return cloned;
  }

  private entriesOfType(equipmentType: EquipmentType) {
    return [...this.countsByEquipmentType[equipmentType].values()];
  }

  entriesFor(equipmentTypes: EquipmentType[]) {
    return equipmentTypes.flatMap((equipmentType) => this.entriesOfType(equipmentType));
  }

  allEntries() {
    return this.entriesFor(iterateNumericEnum(EquipmentType));
  }

  totalFor(equipmentTypes: EquipmentType[]) {
    return this.entriesFor(equipmentTypes).reduce((sum, { count }) => sum + count, 0);
  }
}
