import { DEEPEST_FLOOR } from "@speed-dungeon/common";
import { DungeonRun, SIMULATED_PARTY_CLASSES } from "../sim/dungeon-run";
import { AccuracyAvailability } from "./accuracy-availability";
import { MonsterEvasionTargets, TARGET_HIT_PERCENTAGE } from "./monster-evasion-targets";
import {
  MONSTER_ATTRIBUTE_INTENSITIES,
  MONSTER_ATTRIBUTE_INTENSITY_NAMES,
} from "./monster-attribute-intensity";

const runCount = Number(process.argv[2] ?? 40);
const runs = Array.from({ length: runCount }, () =>
  DungeonRun.random(SIMULATED_PARTY_CLASSES, DEEPEST_FLOOR).walk()
);
const floors = MonsterEvasionTargets.byFloor(AccuracyAvailability.ofRuns(runs));

console.log(`${runCount} runs, target hit rate ${TARGET_HIT_PERCENTAGE}%\n`);
console.log("EVASION");
console.log(
  ["floor", ...MONSTER_ATTRIBUTE_INTENSITIES.map((i) => `${i} ${MONSTER_ATTRIBUTE_INTENSITY_NAMES[i]}`)]
    .map((h) => h.padStart(11))
    .join("")
);
for (const floor of floors) {
  console.log(
    [
      `${floor.floorNumber}`,
      ...MONSTER_ATTRIBUTE_INTENSITIES.map((i) => floor.evasionByIntensity[i].toFixed(1)),
    ]
      .map((c) => c.padStart(11))
      .join("")
  );
}

console.log("\nREFERENCE CHARACTER ACCURACY");
for (const floor of floors) {
  console.log(
    [
      `${floor.floorNumber}`,
      ...MONSTER_ATTRIBUTE_INTENSITIES.map((i) => floor.referenceAccuracyByIntensity[i].toFixed(1)),
    ]
      .map((c) => c.padStart(11))
      .join("")
  );
}
