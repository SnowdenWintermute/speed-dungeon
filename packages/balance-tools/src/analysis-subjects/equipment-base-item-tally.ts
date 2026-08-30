import {
  Equipment,
  EquipmentBaseItem,
  MapUtils,
  NormalizedPercentage,
} from "@speed-dungeon/common";

export interface TalliedBaseItem {
  baseItem: EquipmentBaseItem;
  count: number;
}

export interface BaseItemAndPercent {
  baseItem: EquipmentBaseItem;
  /** the denominator differs by column, so read it off the row field this came from */
  percent: NormalizedPercentage;
}

/**
 * Keying on the pair keeps the base item itself as the map's value, where it stays the intact
 * discriminated union. Keying on the type and rebuilding the base item on read would not typecheck.
 */
export function baseItemKey(baseItem: EquipmentBaseItem) {
  return `${baseItem.equipmentType}-${baseItem.baseItemType}`;
}

export class EquipmentBaseItemTally {
  private tallied = new Map<string, TalliedBaseItem>();

  add(baseItem: EquipmentBaseItem) {
    const key = baseItemKey(baseItem);
    MapUtils.getOrCreate(this.tallied, key, () => ({ baseItem, count: 0 })).count += 1;
  }

  addAllEquipment(equipment: Iterable<Equipment>) {
    for (const item of equipment) {
      this.add(item.equipmentBaseItemProperties);
    }
  }

  /** a snapshot, so a running tally can be read per room without the reader aliasing it */
  entries(): TalliedBaseItem[] {
    return [...this.tallied.values()].map(({ baseItem, count }) => ({ baseItem, count }));
  }

  toPercentages(total: number): BaseItemAndPercent[] {
    return this.entries()
      .map(({ baseItem, count }) => ({ baseItem, percent: count / total }))
      .sort((a, b) => b.percent - a.percent);
  }
}
