import {
  COMBATANT_CLASS_NAME_STRINGS,
  EQUIPMENT_TYPE_STRINGS,
  CombatAttribute,
  Equipment,
  EquipmentBaseItem,
  EquipmentRequirementEntry,
  MapUtils,
  NormalizedPercentage,
  invariant,
} from "@speed-dungeon/common";
import { AnalysisTableRow } from "../../analysis-runs/analysis-sample-table.ts";
import { AnalysisSlice } from "../../analysis-runs/analysis-slice.ts";
import { AvailabilityCurve } from "../../analysis-runs/availability-curve.ts";
import { AvailabilityPoint } from "../../analysis-runs/room-availability.ts";
import { CHARACTER_WEAPON_SPECIALTY_STRINGS } from "../../analysis-subjects/character-weapon-specialty.ts";
import { ANALYSIS_GOAL_STRINGS } from "../../goal-performance-checkers/analysis-goal.ts";
import { EquipmentRequirementTarget } from "./equipment-requirement-target.ts";

/**
 * How much of what a targeted build is actually worth to ask of it. At 1 the requirement is the mean,
 * which means half of that build cannot wear the item where it anchors on the drop curve — a design
 * decision, so it sits here rather than inside a call to `.mean`. Lower it to gate more gently.
 */
const REQUIREMENT_SHARE_OF_MEAN = 1;

/** the generator reads any study's table, so it asks for only the two things it uses */
interface RequirementSourceTable {
  selectRows(slice: AnalysisSlice): AnalysisTableRow[];
  selectAvailabilityCurve(baseItem: EquipmentBaseItem): AvailabilityPoint[];
}

/** the rooms a target's percentile straddles, resolved to what the targeted build was worth in each */
interface AnchoredRows {
  earlier: AnalysisTableRow | null;
  later: AnalysisTableRow;
  weightOfLater: NormalizedPercentage;
}

export function generateEquipmentRequirements(
  table: RequirementSourceTable,
  targets: EquipmentRequirementTarget[]
): EquipmentRequirementEntry[] {
  const byBaseItem = new Map<string, EquipmentRequirementEntry>();

  for (const target of targets) {
    const anchor = selectAnchoredRows(table, target);
    const entry = MapUtils.getOrCreate(
      byBaseItem,
      describeBaseItem(target.baseItem),
      (): EquipmentRequirementEntry => ({ baseItem: target.baseItem, requirements: {} })
    );

    for (const attribute of target.attributes) {
      entry.requirements[attribute] = Math.round(
        readAnchoredMean(anchor, attribute) * REQUIREMENT_SHARE_OF_MEAN
      );
    }
  }

  return [...byBaseItem.values()];
}

/**
 * The build to gate on, read where the item's drop curve reaches the chosen fraction of everything
 * it ever reaches. That point lands between two rooms far more often than on one, so both are kept
 * and blended below — anchoring on the room that crossed the threshold would round the requirement
 * up to the next whole allocation step.
 */
function selectAnchoredRows(
  table: RequirementSourceTable,
  target: EquipmentRequirementTarget
): AnchoredRows {
  const curve = new AvailabilityCurve(
    table.selectAvailabilityCurve(target.baseItem),
    describeBaseItem(target.baseItem)
  );
  const { earlier, later, weightOfLater } = curve.selectAnchor(target.availabilityPercentile);
  const rows = table.selectRows(target.buildSlice);

  return {
    earlier: earlier === null ? null : selectRowInRoom(rows, earlier, target),
    later: selectRowInRoom(rows, later, target),
    weightOfLater,
  };
}

function selectRowInRoom(
  rows: AnalysisTableRow[],
  location: { floor: number; room: number },
  target: EquipmentRequirementTarget
) {
  const { floor, room } = location;
  const row = rows.find((candidate) => candidate.floor === floor && candidate.room === room);

  invariant(
    row !== undefined,
    `${describeBaseItem(target.baseItem)} anchors across floor ${floor} room ${room}, where this ` +
      `run set has no samples for ${describeSlice(target.buildSlice)} — either the study's party ` +
      `never seats that build, or it did not reach that room`
  );

  return row;
}

function readAnchoredMean(
  { earlier, later, weightOfLater }: AnchoredRows,
  attribute: CombatAttribute
) {
  const meanAtLater = later.totalAttributes[attribute].mean;

  if (earlier === null) {
    return meanAtLater;
  }

  const meanAtEarlier = earlier.totalAttributes[attribute].mean;

  return meanAtEarlier + (meanAtLater - meanAtEarlier) * weightOfLater;
}

function describeBaseItem(baseItem: EquipmentBaseItem) {
  return `${EQUIPMENT_TYPE_STRINGS[baseItem.equipmentType]} ${Equipment.getBaseItemStringName(baseItem)}`;
}

function describeSlice(slice: AnalysisSlice) {
  const parts: string[] = [];

  if (slice.goal !== undefined) {
    parts.push(ANALYSIS_GOAL_STRINGS[slice.goal]);
  }
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
