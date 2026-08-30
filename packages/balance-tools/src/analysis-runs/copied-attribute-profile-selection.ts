import { ArrayUtils, COMBAT_ATTRIBUTES, CombatAttribute } from "@speed-dungeon/common";
import type { CopiedAttributeProfileRoom } from "../analysis-subjects/attribute-source.ts";
import { AnalysisSampleDimensions, RoomGroupedSamples } from "./analysis-sample.ts";
import { AnalysisSlice } from "./analysis-slice.ts";

/**
 * What one build was worth room by room, read out of any study's samples: every sample carries the
 * attributes behind whatever its own study measured, so this needs none of that study's table.
 *
 * Rounded rather than floored, because the requirement generator rounds the same means when it turns
 * them into gates. A character pinned to the floor of a mean it was gated on would miss its own
 * requirement by a point in the room the requirement was anchored to.
 */
export function selectCopiedAttributeProfile(
  samples: readonly AnalysisSampleDimensions[],
  slice: AnalysisSlice
): CopiedAttributeProfileRoom[] {
  return new RoomGroupedSamples(samples)
    .selectRooms(slice)
    .map(({ floor, room, samples: samplesInRoom }) => ({
      floor,
      room,
      attributes: meanAttributes(samplesInRoom),
    }));
}

/** armor class is what a copying study measures, so it is the one attribute never handed over */
function meanAttributes(samples: AnalysisSampleDimensions[]) {
  const attributes: Partial<Record<CombatAttribute, number>> = {};

  for (const attribute of COMBAT_ATTRIBUTES) {
    if (attribute === CombatAttribute.ArmorClass) {
      continue;
    }
    attributes[attribute] = Math.round(
      ArrayUtils.average(samples.map((sample) => sample.totalAttributes[attribute]))
    );
  }

  return attributes;
}
