import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEEPEST_FLOOR } from "@speed-dungeon/common";
import { DungeonRun } from "../../sim/dungeon-run";
import { AccuracyAvailability } from "../accuracy-availability/index";
import {
  GENERATED_MONSTER_EVASION_PATH,
  renderMonsterEvasionModule,
} from "./emit-monster-evasion-module";
import { MonsterEvasionTargets } from "./monster-evasion-targets";

/** Each cell of the emitted matrix rests on one floor's rooms, so this is high on purpose. */
const DEFAULT_RUN_COUNT = 500;
const PACKAGE_ROOT = fileURLToPath(new URL("../../..", import.meta.url));

const runCount = Number(process.argv[2] ?? DEFAULT_RUN_COUNT);
console.log(`walking ${runCount} runs to floor ${DEEPEST_FLOOR}...`);

const availability = new AccuracyAvailability();
const started = Date.now();

for (let run = 0; run < runCount; run += 1) {
  availability.collectRun(DungeonRun.random(availability.nextPartyClasses(), DEEPEST_FLOOR).walk());
}

const floors = MonsterEvasionTargets.byFloor(availability.assemble());
const destination = path.join(PACKAGE_ROOT, GENERATED_MONSTER_EVASION_PATH);
fs.writeFileSync(destination, renderMonsterEvasionModule(floors, runCount));

console.log(
  `wrote ${destination} from ${runCount} runs in ${((Date.now() - started) / 1000).toFixed(1)}s`
);
