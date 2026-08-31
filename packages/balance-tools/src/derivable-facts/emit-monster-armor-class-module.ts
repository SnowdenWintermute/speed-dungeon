import { DEEPEST_FLOOR, FloorNumber, invariant } from "@speed-dungeon/common";
import { emitGeneratedModuleHeader } from "../generated-module-header.ts";

// no node imports: the browser renders the text and the dev server only writes it

export const GENERATED_MONSTER_ARMOR_CLASS_MODULE_PATH =
  "packages/common/src/monsters/monster-armor-class.generated.ts";

const HEADER = `${emitGeneratedModuleHeader({
  // named by analysis rather than by study: every sampled damage study reports this table and any
  // of them can write this file
  source: `a sampled damage study in packages/balance-tools`,
  regenerate: `run one of those studies and press "generate monster armor class"`,
  imports: [{ from: "../aliases.js", typeNames: ["FloorNumber"] }],
})}
export const MONSTER_ARMOR_CLASS_BY_FLOOR: Record<FloorNumber, number> = {`;

export function emitMonsterArmorClassModule(armorClassByFloor: Map<FloorNumber, number>) {
  const entries: string[] = [];

  for (let floor = 1; floor <= DEEPEST_FLOOR; floor += 1) {
    const armorClass = armorClassByFloor.get(floor);
    invariant(armorClass !== undefined, `the run set reached no rooms on floor ${floor}`);
    entries.push(`  ${floor}: ${armorClass},`);
  }

  return `${HEADER}\n${entries.join("\n")}\n};\n`;
}
