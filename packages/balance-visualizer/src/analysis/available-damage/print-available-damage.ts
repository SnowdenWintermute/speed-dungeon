import { CombatAttribute, COMBAT_ATTRIBUTE_STRINGS, DEEPEST_FLOOR } from "@speed-dungeon/common";
import { DungeonRun } from "../../sim/dungeon-run";
import { DAMAGE_CHANNELS, DAMAGE_CHANNEL_NAMES } from "../equipment-damage-sources";
import { ComboRoomDamage } from "./combo-samples";
import { formatOptionalNumber, formatWeaponUsage } from "../../utils/format";
import {
  AvailableDamageBySpecialty,
  AvailableDamageResults,
  DEFAULT_ATTACK_DAMAGE_INTENSITY,
  RoomAvailableDamage,
} from "./index";
import { PartyDrawMode } from "./party-draw";
import { comboKey, comboName, SpecialtyComboKey, SPECIALTY_COMBOS } from "./specialty-combo";

const DEFAULT_RUN_COUNT = 24;

interface Column {
  heading: string;
  select: (combo: undefined | ComboRoomDamage) => string;
}

const COLUMNS: Column[] = [
  {
    heading: "dmg p10",
    select: (combo) => formatOptionalNumber(combo?.damagePerTurn?.tenthPercentile),
  },
  { heading: "dmg median", select: (combo) => formatOptionalNumber(combo?.damagePerTurn?.median) },
  {
    heading: "dmg p90",
    select: (combo) => formatOptionalNumber(combo?.damagePerTurn?.ninetiethPercentile),
  },
  { heading: "excluded", select: (combo) => `${combo?.unavailableCount ?? 0}` },
  ...DAMAGE_CHANNELS.flatMap((channel) => [
    {
      heading: `${DAMAGE_CHANNEL_NAMES[channel]} av`,
      select: (combo: undefined | ComboRoomDamage) =>
        formatOptionalNumber(combo?.meanAvailability?.[channel]),
    },
    {
      heading: `${DAMAGE_CHANNEL_NAMES[channel]} %`,
      select: (combo: undefined | ComboRoomDamage) =>
        formatOptionalNumber(combo?.meanPercentOfAvailabilityAllocated?.[channel], 0),
    },
  ]),
  ...[CombatAttribute.Strength, CombatAttribute.Dexterity].map((attribute) => ({
    heading: `pts ${COMBAT_ATTRIBUTE_STRINGS[attribute]}`,
    select: (combo: undefined | ComboRoomDamage) =>
      formatOptionalNumber(combo?.meanAllocation?.fromDiscretionaryPoints[attribute]),
  })),
  {
    heading: "pts %",
    select: (combo) => formatOptionalNumber(combo?.meanPercentOfPointsAllocated, 0),
  },
  { heading: "inherent str", select: (combo) => formatOptionalNumber(combo?.meanInherentStrength) },
  {
    heading: "inherent dex",
    select: (combo) => formatOptionalNumber(combo?.meanInherentDexterity),
  },
  { heading: "weapons used", select: (combo) => formatWeaponUsage(combo?.selectedWeapons) },
  { heading: "weapons available", select: (combo) => formatWeaponUsage(combo?.availableWeapons) },
];

function printCombo(rooms: RoomAvailableDamage[], key: SpecialtyComboKey, heading: string) {
  const withSamples = AvailableDamageResults.withLootDropped(rooms).filter(
    (room) => room.byCombo[key] !== undefined
  );
  if (withSamples.length === 0) {
    return;
  }

  console.log(`\n${heading}`);
  const headings = ["room", ...COLUMNS.map((column) => column.heading)];
  const rows = [
    headings,
    ...withSamples.map((room) => [
      `${room.floor}-${room.roomNumberOnFloor}`,
      ...COLUMNS.map((column) => column.select(room.byCombo[key])),
    ]),
  ];

  const widths = headings.map((_, index) =>
    Math.max(...rows.map((row) => (row[index] ?? "").length))
  );
  for (const row of rows) {
    console.log(row.map((cell, index) => cell.padStart(widths[index] ?? 0)).join("  "));
  }
}

const runCount = Number(process.argv[2] ?? DEFAULT_RUN_COUNT);
const attackDamageIntensity = Number(process.argv[3] ?? DEFAULT_ATTACK_DAMAGE_INTENSITY);
const deepestFloor = Number(process.argv[4] ?? DEEPEST_FLOOR);

console.log(
  `walking ${runCount} runs to floor ${deepestFloor} at attack damage intensity ${attackDamageIntensity}, evenly over ${SPECIALTY_COMBOS.length} combos...`
);

const availability = new AvailableDamageBySpecialty(Math.random, {
  attackDamageIntensity,
  draw: { type: PartyDrawMode.EvenlyDistributed },
});
const started = Date.now();

for (let run = 0; run < runCount; run += 1) {
  availability.collectRun(DungeonRun.random(availability.nextParty(), deepestFloor).walk());
}

const rooms = AvailableDamageResults.describe(availability.assemble());
console.log(`${runCount} runs in ${((Date.now() - started) / 1000).toFixed(1)}s`);

for (const combo of SPECIALTY_COMBOS) {
  printCombo(rooms, comboKey(combo), comboName(combo));
}
