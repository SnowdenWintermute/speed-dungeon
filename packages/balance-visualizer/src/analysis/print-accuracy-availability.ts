import { DEEPEST_FLOOR } from "@speed-dungeon/common";
import { DungeonRun, SIMULATED_PARTY_CLASSES } from "../sim/dungeon-run";
import { AccuracyAvailability, RoomAccuracyAvailability } from "./accuracy-availability";

const DEFAULT_RUN_COUNT = 100;

const COLUMNS: { heading: string; select: (room: RoomAccuracyAvailability) => string }[] = [
  { heading: "room", select: (room) => `${room.floorNumber}-${room.roomNumberOnFloor}` },
  { heading: "n", select: (room) => `${room.ordinal}` },
  { heading: "affix acc", select: (room) => room.fromAccuracyAffixes.mean.toFixed(1) },
  { heading: "dex acc", select: (room) => room.fromDexterity.mean.toFixed(1) },
  { heading: "loot total", select: (room) => room.fromAllLoot.mean.toFixed(1) },
  {
    heading: "10th percentile",
    select: (room) => room.fromAllLoot.tenthPercentile.toFixed(1),
  },
  { heading: "median", select: (room) => room.fromAllLoot.median.toFixed(1) },
  {
    heading: "90th percentile",
    select: (room) => room.fromAllLoot.ninetiethPercentile.toFixed(1),
  },
  { heading: "inherent", select: (room) => room.potential.asPlayed.mean.toFixed(1) },
  { heading: "+support", select: (room) => room.potential.withSupportClass.mean.toFixed(1) },
  { heading: "max dex", select: (room) => room.potential.withMaxDexterity.mean.toFixed(1) },
  {
    heading: "max dex +support",
    select: (room) => room.potential.withMaxDexterityAndSupportClass.mean.toFixed(1),
  },
  { heading: "alloc only", select: (room) => room.potential.fromAllocatedPoints.mean.toFixed(1) },
  {
    heading: "alloc only +support",
    select: (room) => room.potential.fromAllocatedPointsWithSupportClass.mean.toFixed(1),
  },
];

function printTable(rooms: RoomAccuracyAvailability[]) {
  const rows = [
    COLUMNS.map((column) => column.heading),
    ...rooms.map((room) => COLUMNS.map((column) => column.select(room))),
  ];

  const widths = COLUMNS.map((_, index) =>
    Math.max(...rows.map((row) => (row[index] ?? "").length))
  );

  for (const row of rows) {
    console.log(row.map((cell, index) => cell.padStart(widths[index] ?? 0)).join("  "));
  }
}

const runCount = Number(process.argv[2] ?? DEFAULT_RUN_COUNT);
console.log(`walking ${runCount} runs of ${SIMULATED_PARTY_CLASSES.length} characters...`);

const runs = Array.from({ length: runCount }, () =>
  DungeonRun.random(SIMULATED_PARTY_CLASSES, DEEPEST_FLOOR).walk()
);

printTable(AccuracyAvailability.ofRuns(runs));
