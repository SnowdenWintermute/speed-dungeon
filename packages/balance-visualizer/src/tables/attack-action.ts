import {
  CombatantClass,
  Equipment,
  EquipmentBaseItem,
  EquipmentType,
  HOLDABLE_SLOT_IDS,
  invariant,
  NormalizedPercentage,
} from "@speed-dungeon/common";
import { EquipmentBaseItemTally } from "@/analysis-subjects/equipment-base-item-tally";
import { DataTableColumn } from "@speed-dungeon/ui/atoms/DataTable/column";
import { AttackDamageSample } from "@/analysis-runs/attack-damage/samples";
import { AttackDamageContributingAttribute } from "@/analysis-runs/analysis-run-reporter";
import { Distribution } from "@/analysis-runs/distribution";
import {
  AnalysisCharacterSpecification,
  CharacterWeaponSpecialty,
} from "@/analysis-subjects/analysis-character-specification";

export interface HoldableAndPercent {
  baseItem: EquipmentBaseItem;
  /** the denominator differs by column, so read it off the row field this came from */
  percent: NormalizedPercentage;
}

type AverageContributingAttributes = Record<
  AttackDamageContributingAttribute,
  { fromGear: number; allocated: number; inherent: number; total: number }
>;

export interface AttackDamageTableRow {
  floor: number;
  room: number;
  sampleCount: number;
  damageOnDummy: Distribution;
  averageContributingAttributes: AverageContributingAttributes;
  /** percent of matched characters that were holding it in this room */
  wornHoldablePercentages: HoldableAndPercent[];
  /** percent of runs in which it had dropped by this room, limited to types the build uses */
  availableHoldablePercentages: HoldableAndPercent[];
}

/** an omitted dimension means "any", so dropping one widens the slice without a re-run */
export interface AttackDamageSlice {
  weaponSpecialty?: CharacterWeaponSpecialty;
  mainClass?: CombatantClass;
  supportClass?: CombatantClass | null;
}

export class AttackDamageTable {
  constructor(private samples: readonly AttackDamageSample[]) {}

  private matchesSlice(sample: AttackDamageSample, slice: AttackDamageSlice) {
    if (slice.weaponSpecialty !== undefined && sample.weaponSpecialty !== slice.weaponSpecialty) {
      return false;
    }
    if (slice.mainClass !== undefined && sample.mainClass !== slice.mainClass) {
      return false;
    }
    if (slice.supportClass !== undefined && sample.supportClass !== slice.supportClass) {
      return false;
    }
    return true;
  }

  private groupByRoom(samples: AttackDamageSample[]) {
    const byFloor = new Map<number, Map<number, AttackDamageSample[]>>();
    for (const sample of samples) {
      let byRoom = byFloor.get(sample.floor);
      if (byRoom === undefined) {
        byRoom = new Map();
        byFloor.set(sample.floor, byRoom);
      }
      const roomSamples = byRoom.get(sample.room) ?? [];
      roomSamples.push(sample);
      byRoom.set(sample.room, roomSamples);
    }
    return byFloor;
  }

  private averageContribution(
    samples: AttackDamageSample[],
    attribute: AttackDamageContributingAttribute
  ) {
    let fromGear = 0;
    let allocated = 0;
    let inherent = 0;
    for (const sample of samples) {
      const contribution = sample.contributingAllocations[attribute];
      fromGear += contribution.fromGear;
      allocated += contribution.allocated;
      inherent += contribution.inherent;
    }
    return {
      fromGear: fromGear / samples.length,
      allocated: allocated / samples.length,
      inherent: inherent / samples.length,
      total: (fromGear + allocated + inherent) / samples.length,
    };
  }

  private averageContributingAttributes(
    samples: AttackDamageSample[]
  ): AverageContributingAttributes {
    return {
      [AttackDamageContributingAttribute.Strength]: this.averageContribution(
        samples,
        AttackDamageContributingAttribute.Strength
      ),
      [AttackDamageContributingAttribute.Dexterity]: this.averageContribution(
        samples,
        AttackDamageContributingAttribute.Dexterity
      ),
      [AttackDamageContributingAttribute.Accuracy]: this.averageContribution(
        samples,
        AttackDamageContributingAttribute.Accuracy
      ),
      [AttackDamageContributingAttribute.FlatDamage]: this.averageContribution(
        samples,
        AttackDamageContributingAttribute.FlatDamage
      ),
    };
  }

  /** counted once per character even when both hands hold the same base item */
  private wornHoldablePercentages(samples: AttackDamageSample[]) {
    const tally = new Map<string, { baseItem: EquipmentBaseItem; occurrences: number }>();

    for (const sample of samples) {
      const heldThisSample = new Map<string, EquipmentBaseItem>();
      for (const slotId of HOLDABLE_SLOT_IDS) {
        const baseItem = sample.wornHoldables[slotId];
        if (baseItem !== null) {
          heldThisSample.set(Equipment.getBaseItemStringName(baseItem), baseItem);
        }
      }
      for (const [name, baseItem] of heldThisSample) {
        const entry = tally.get(name) ?? { baseItem, occurrences: 0 };
        entry.occurrences += 1;
        tally.set(name, entry);
      }
    }

    return AttackDamageTable.toPercentages(tally, samples.length);
  }

  /**
   * What dropped is a fact about the party, so this counts distinct runs. Characters sampled in the
   * same room of the same run share one tally, and counting each of them would report an item as
   * available more often than it was.
   */
  private availableHoldablePercentages(samples: AttackDamageSample[]) {
    const usedHoldableTypes = new Set<EquipmentType>();
    const availableEquipmentByRun = new Map<number, EquipmentBaseItemTally>();

    for (const sample of samples) {
      for (const equipmentType of AnalysisCharacterSpecification.getUsedHoldableTypes(
        sample.weaponSpecialty
      )) {
        usedHoldableTypes.add(equipmentType);
      }
      availableEquipmentByRun.set(sample.runIndex, sample.availableEquipment);
    }

    const tally = new Map<string, { baseItem: EquipmentBaseItem; occurrences: number }>();
    for (const availableEquipment of availableEquipmentByRun.values()) {
      for (const { baseItem } of availableEquipment.entriesFor([...usedHoldableTypes])) {
        const name = Equipment.getBaseItemStringName(baseItem);
        const entry = tally.get(name) ?? { baseItem, occurrences: 0 };
        entry.occurrences += 1;
        tally.set(name, entry);
      }
    }

    return AttackDamageTable.toPercentages(tally, availableEquipmentByRun.size);
  }

  private static toPercentages(
    tally: Map<string, { baseItem: EquipmentBaseItem; occurrences: number }>,
    total: number
  ): HoldableAndPercent[] {
    return [...tally.values()]
      .map(({ baseItem, occurrences }) => ({ baseItem, percent: occurrences / total }))
      .sort((a, b) => b.percent - a.percent);
  }

  selectRows(slice: AttackDamageSlice): AttackDamageTableRow[] {
    const matching = this.samples.filter((sample) => this.matchesSlice(sample, slice));
    const byFloor = this.groupByRoom(matching);

    const rows: AttackDamageTableRow[] = [];
    for (const [floor, byRoom] of byFloor) {
      for (const [room, roomSamples] of byRoom) {
        invariant(roomSamples.length > 0, "a grouped room always has at least one sample");
        rows.push({
          floor,
          room,
          sampleCount: roomSamples.length,
          damageOnDummy: Distribution.of(
            roomSamples.map((sample) => sample.sampledDamageOnDummy)
          ),
          averageContributingAttributes: this.averageContributingAttributes(roomSamples),
          wornHoldablePercentages: this.wornHoldablePercentages(roomSamples),
          availableHoldablePercentages: this.availableHoldablePercentages(roomSamples),
        });
      }
    }

    return rows.sort((a, b) => a.floor - b.floor || a.room - b.room);
  }
}

export const ATTACK_DAMAGE_TABLE_COLUMNS: DataTableColumn<AttackDamageTableRow>[] = [
  { header: "Floor", renderCell: (row) => row.floor },
  { header: "Room", renderCell: (row) => row.room },
  { header: "Samples", renderCell: (row) => row.sampleCount },
  { header: "Damage (median)", renderCell: (row) => row.damageOnDummy.median.toFixed(1) },
  { header: "Damage (mean)", renderCell: (row) => row.damageOnDummy.mean.toFixed(1) },
  {
    header: "Damage (low decile)",
    renderCell: (row) => row.damageOnDummy.tenthPercentileAverage.toFixed(1),
  },
  {
    header: "Damage (high decile)",
    renderCell: (row) => row.damageOnDummy.ninetiethPercentileAverage.toFixed(1),
  },
  {
    header: "Str",
    renderCell: (row) =>
      row.averageContributingAttributes[
        AttackDamageContributingAttribute.Strength
      ].total.toFixed(1),
  },
  {
    header: "Dex",
    renderCell: (row) =>
      row.averageContributingAttributes[
        AttackDamageContributingAttribute.Dexterity
      ].total.toFixed(1),
  },
  {
    header: "Acc",
    renderCell: (row) =>
      row.averageContributingAttributes[
        AttackDamageContributingAttribute.Accuracy
      ].total.toFixed(1),
  },
];
