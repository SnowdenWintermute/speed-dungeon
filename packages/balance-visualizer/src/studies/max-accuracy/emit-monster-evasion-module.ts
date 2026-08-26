import { DEEPEST_FLOOR, FloorNumber, invariant } from "@speed-dungeon/common";

// no node imports: the browser renders the text and the dev server only writes it

export const GENERATED_MONSTER_EVASION_MODULE_PATH =
  "packages/common/src/monsters/monster-evasion.generated.ts";

const HEADER = `// GENERATED FILE — do not edit by hand.
// Source: the Max accuracy study in packages/balance-visualizer
// Regenerate by running that study and pressing "generate monster evasion".
import type { FloorNumber } from "../aliases.js";

export const MONSTER_EVASION_BY_FLOOR: Record<FloorNumber, number> = {`;

export function emitMonsterEvasionModule(evasionByFloor: Map<FloorNumber, number>) {
  const entries: string[] = [];

  for (let floor = 1; floor <= DEEPEST_FLOOR; floor += 1) {
    const evasion = evasionByFloor.get(floor);
    invariant(evasion !== undefined, `the run set reached no rooms on floor ${floor}`);
    entries.push(`  ${floor}: ${evasion},`);
  }

  return `${HEADER}\n${entries.join("\n")}\n};\n`;
}
