import {
  ArrayUtils,
  COMBATANT_CLASS_NAME_STRINGS,
  EQUIPMENT_TYPE_STRINGS,
  Equipment,
  EquipmentBaseItem,
  EquipmentRequirementEntry,
  MapUtils,
  invariant,
} from "@speed-dungeon/common";
import { AnalysisTableRow } from "@/analysis-runs/analysis-sample-table";
import { AnalysisSlice } from "@/analysis-runs/analysis-slice";
import { AvailabilityPoint } from "@/analysis-runs/room-availability";
import { CHARACTER_WEAPON_SPECIALTY_STRINGS } from "@/analysis-subjects/character-weapon-specialty";
import { EquipmentRequirementTarget } from "./requirement-target";

/**
 * How much of what a targeted build is actually worth to ask of it. At 1 the requirement is the mean,
 * which means half of that build cannot wear the item in the room it most likely drops in — a design
 * decision, so it sits here rather than inside a call to `.mean`. Lower it to gate more gently.
 */
const REQUIREMENT_SHARE_OF_MEAN = 1;

/** the generator reads any study's table, so it asks for only the two things it uses */
interface RequirementSourceTable {
  selectRows(slice: AnalysisSlice): AnalysisTableRow[];
  selectAvailabilityCurve(baseItem: EquipmentBaseItem): AvailabilityPoint[];
}

export function generateEquipmentRequirements(
  table: RequirementSourceTable,
  targets: EquipmentRequirementTarget[]
): EquipmentRequirementEntry[] {
  const byBaseItem = new Map<string, EquipmentRequirementEntry>();

  for (const target of targets) {
    const row = selectAnchorRow(table, target);
    const entry = MapUtils.getOrCreate(
      byBaseItem,
      describeBaseItem(target.baseItem),
      (): EquipmentRequirementEntry => ({ baseItem: target.baseItem, requirements: {} })
    );

    for (const attribute of target.attributes) {
      entry.requirements[attribute] = Math.round(
        row.totalAttributes[attribute].mean * REQUIREMENT_SHARE_OF_MEAN
      );
    }
  }

  return [...byBaseItem.values()];
}

/**
 * The room to read the targeted build from: where the item's drop curve first reaches the chosen
 * fraction of everything it ever reaches. Measured against that ceiling rather than against 100%, so
 * an item too rare to ever be likely still anchors somewhere sensible.
 */
function selectAnchorRoom(table: RequirementSourceTable, target: EquipmentRequirementTarget) {
  const name = describeBaseItem(target.baseItem);
  const curve = table.selectAvailabilityCurve(target.baseItem);
  invariant(curve.length > 0, `the run set reached no rooms, so ${name} has no drop curve`);

  const highest = ArrayUtils.getExpectedAtIndex(curve, curve.length - 1).percentOfRuns;
  invariant(highest > 0, `${name} never dropped in any run, so there is no room to read a build from`);

  // the > 0 is what makes a percentile of 0 mean the first room it ever dropped in, not room one
  const threshold = highest * target.availabilityPercentile;
  const anchor = curve.find((point) => point.percentOfRuns > 0 && point.percentOfRuns >= threshold);
  invariant(anchor !== undefined, `${name} reached no room at or above ${threshold} of its runs`);

  return anchor;
}

function selectAnchorRow(table: RequirementSourceTable, target: EquipmentRequirementTarget) {
  const { floor, room } = selectAnchorRoom(table, target);
  const row = table
    .selectRows(target.buildSlice)
    .find((candidate) => candidate.floor === floor && candidate.room === room);

  invariant(
    row !== undefined,
    `${describeBaseItem(target.baseItem)} anchors on floor ${floor} room ${room}, where this run ` +
      `set has no samples for ${describeSlice(target.buildSlice)} — either the study's party never ` +
      `seats that build, or it did not reach that room`
  );

  return row;
}

function describeBaseItem(baseItem: EquipmentBaseItem) {
  return `${EQUIPMENT_TYPE_STRINGS[baseItem.equipmentType]} ${Equipment.getBaseItemStringName(baseItem)}`;
}

function describeSlice(slice: AnalysisSlice) {
  const parts: string[] = [];

  if (slice.weaponSpecialty !== undefined) {
    parts.push(CHARACTER_WEAPON_SPECIALTY_STRINGS[slice.weaponSpecialty]);
  }
  if (slice.mainClass !== undefined) {
    parts.push(`main ${COMBATANT_CLASS_NAME_STRINGS[slice.mainClass]}`);
  }
  if (slice.supportClass !== undefined) {
    parts.push(
      slice.supportClass === null
        ? "no support class"
        : `support ${COMBATANT_CLASS_NAME_STRINGS[slice.supportClass]}`
    );
  }

  return parts.length === 0 ? "any build" : parts.join(", ");
}
