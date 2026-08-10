import {
  MONSTER_ATTRIBUTE_INTENSITIES,
  MonsterAttributeIntensity,
} from "./monster-attribute-intensity";
import { FloorEvasionTargets, TARGET_HIT_PERCENTAGE } from "./monster-evasion-targets";

/** Relative to the package root, and fixed. The dev server writes this on request from the browser,
 * so the path deliberately does not travel with the request — the only thing a caller supplies is
 * the contents. */
export const GENERATED_MONSTER_EVASION_PATH = "src/dummies/monster-evasion.generated.ts";

/** Nothing in this file touches the filesystem, because both callers need the text and only one of
 * them can write it: the CLI writes it directly, and the browser posts it to the dev server. */

/** Every measured cell, rather than a curve fitted through them.
 *
 * The depth axis was already kept as measured — a straight line through it misses by up to 2.3
 * because the party's level plateaus on floors 4 and 8, which is the XP curve showing through rather
 * than sampling noise. The intensity axis has the same character: a single multiplier per intensity
 * cannot represent VeryLow, the one profile with no support class and no allocation, whose accuracy
 * does not track loot the way the others do and which therefore drifts against Medium in a
 * direction that reverses with depth.
 *
 * The cost is that each cell now rests on its own floor's rooms instead of pooling evidence across
 * the ten of them, so this wants a run count in the hundreds. */
function renderMatrix(
  name: string,
  floors: FloorEvasionTargets[],
  select: (floor: FloorEvasionTargets, intensity: MonsterAttributeIntensity) => number
) {
  const rows = floors.map((floor) => {
    const cells = MONSTER_ATTRIBUTE_INTENSITIES.map(
      (intensity) =>
        `    [MonsterAttributeIntensity.${MonsterAttributeIntensity[intensity]}]: ${select(floor, intensity).toFixed(1)},`
    );
    return `  ${floor.floorNumber}: {\n${cells.join("\n")}\n  },`;
  });

  return `export const ${name}: Record<
  number,
  Record<MonsterAttributeIntensity, number>
> = {
${rows.join("\n")}
};
`;
}

export function renderMonsterEvasionModule(floors: FloorEvasionTargets[], runCount: number) {
  return `// GENERATED FILE — do not edit by hand.
// Source: ${runCount} simulated ten-floor walks, each intensity solved for a ${TARGET_HIT_PERCENTAGE}% hit
// rate against its reference character (see REFERENCE_CHARACTER_PROFILES).
// Regenerate with: yarn derive:evasion, or the button under the accuracy analysis in the app.
//
// Regenerate whenever any of these change: the Dexterity to Accuracy ratio, the affix templates or
// their tier values, class accuracy growth, drop rates, the XP curve or level pacing, party size, or
// the equipment slot model in EquipmentPoolBySlot.
import { MonsterAttributeIntensity } from "../analysis/monster-attributes/monster-attribute-intensity";

${renderMatrix("MONSTER_EVASION_BY_FLOOR", floors, (floor, intensity) => floor.evasionByIntensity[intensity])}
${renderMatrix(
  // nothing reads this — it is here so a surprising evasion figure can be traced to the character it
  // was derived from without re-running the walk
  "REFERENCE_ACCURACY_BY_FLOOR",
  floors,
  (floor, intensity) => floor.referenceAccuracyByIntensity[intensity]
)}`;
}
