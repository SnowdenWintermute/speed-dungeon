import { CombatAttribute, COMBAT_ATTRIBUTE_STRINGS, DEEPEST_FLOOR } from "@speed-dungeon/common";
import { DungeonRun } from "../../sim/dungeon-run";
import { CHARACTER_ARCHETYPE_NAMES, CHARACTER_ARCHETYPES } from "../character-archetype";
import { DAMAGE_CHANNELS } from "../equipment-damage-sources";
import {
  AvailableDamageBySpecialty,
  DEFAULT_ATTACK_DAMAGE_INTENSITY,
  RoomAvailableDamage,
  SpecialtyRoomDamage,
} from "./index";

const DEFAULT_RUN_COUNT = 20;

interface Column {
  heading: string;
  select: (room: RoomAvailableDamage) => string;
}

const IDENTITY_COLUMNS: Column[] = [
  { heading: "room", select: (room) => `${room.floorNumber}-${room.roomNumberOnFloor}` },
  { heading: "n", select: (room) => `${room.ordinal}` },
];

/** What one character could be wearing before any of it is spent — the figure everything else is
 * derived from, so it is worth seeing next to the damage it produces. */
const AVAILABILITY_COLUMNS: Column[] = DAMAGE_CHANNELS.map((channel) => ({
  heading: `avail ${channel}`,
  select: (room: RoomAvailableDamage) => room.availability[channel].toFixed(1),
}));

function damageColumns(): Column[] {
  return CHARACTER_ARCHETYPES.map((archetype) => ({
    heading: CHARACTER_ARCHETYPE_NAMES[archetype],
    select: (room: RoomAvailableDamage) => {
      const specialty = room.bySpecialty[archetype];
      if (specialty?.damagePerTurn == null) {
        return "-";
      }
      return specialty.damagePerTurn.mean.toFixed(1);
    },
  }));
}

function unavailableColumns(): Column[] {
  return CHARACTER_ARCHETYPES.map((archetype) => ({
    heading: `${CHARACTER_ARCHETYPE_NAMES[archetype]} n/a %`,
    select: (room: RoomAvailableDamage) => {
      const specialty = room.bySpecialty[archetype];
      return specialty === undefined ? "-" : specialty.percentRunsUnavailable.toFixed(0);
    },
  }));
}

function printTable(heading: string, columns: Column[], rooms: RoomAvailableDamage[]) {
  console.log(`\n${heading}`);

  const rows = [
    columns.map((column) => column.heading),
    ...rooms.map((room) => columns.map((column) => column.select(room))),
  ];
  const widths = columns.map((_, index) => Math.max(...rows.map((row) => (row[index] ?? "").length)));

  for (const row of rows) {
    console.log(row.map((cell, index) => cell.padStart(widths[index] ?? 0)).join("  "));
  }
}

/** One table per specialty, so the allocation it chose can be read alongside the damage it reached. */
function printSpecialtyAllocations(rooms: RoomAvailableDamage[]) {
  for (const archetype of CHARACTER_ARCHETYPES) {
    const present = (room: RoomAvailableDamage) => room.bySpecialty[archetype];
    const gearColumns: Column[] = DAMAGE_CHANNELS.map((channel) => ({
      heading: `gear ${channel}`,
      select: (room) => format(present(room), (specialty) => specialty.meanAllocation?.fromGear[channel]),
    }));

    const pointColumns: Column[] = [CombatAttribute.Strength, CombatAttribute.Dexterity].map(
      (attribute) => ({
        heading: `pts ${COMBAT_ATTRIBUTE_STRINGS[attribute]}`,
        select: (room) =>
          format(present(room), (specialty) => specialty.meanAllocation?.fromDiscretionaryPoints[attribute]),
      })
    );

    printTable(
      `${CHARACTER_ARCHETYPE_NAMES[archetype]} — allocation and weapon`,
      [
        ...IDENTITY_COLUMNS,
        { heading: "dmg/turn", select: (room) => format(present(room), (specialty) => specialty.damagePerTurn?.mean) },
        ...gearColumns,
        ...pointColumns,
        {
          heading: "main hand",
          select: (room) =>
            formatRange(present(room)?.meanWeaponDamage?.mainHand),
        },
        {
          heading: "off hand",
          select: (room) => formatRange(present(room)?.meanWeaponDamage?.offHand),
        },
        { heading: "n/a %", select: (room) => format(present(room), (specialty) => specialty.percentRunsUnavailable) },
      ],
      rooms
    );
  }
}

function format(
  specialty: undefined | SpecialtyRoomDamage,
  select: (specialty: SpecialtyRoomDamage) => undefined | number
) {
  if (specialty === undefined) {
    return "-";
  }
  const value = select(specialty);
  return value === undefined ? "-" : value.toFixed(1);
}

function formatRange(range: undefined | null | { min: number; max: number }) {
  return range == null ? "-" : `${range.min.toFixed(0)}-${range.max.toFixed(0)}`;
}

const runCount = Number(process.argv[2] ?? DEFAULT_RUN_COUNT);
const attackDamageIntensity = Number(process.argv[3] ?? DEFAULT_ATTACK_DAMAGE_INTENSITY);
// the pool grows all the way down, so a shallow walk is the way to see this working before the deep
// floors decide how long it takes
const deepestFloor = Number(process.argv[4] ?? DEEPEST_FLOOR);

console.log(
  `walking ${runCount} runs to floor ${deepestFloor} at attack damage intensity ${attackDamageIntensity}, re-drawing the party each time...`
);

const availability = new AvailableDamageBySpecialty(Math.random, attackDamageIntensity);
const started = Date.now();

for (let run = 0; run < runCount; run += 1) {
  availability.collectRun(DungeonRun.random(availability.nextPartyClasses(), deepestFloor).walk());
}

const rooms = availability.assemble();
console.log(`${runCount} runs in ${((Date.now() - started) / 1000).toFixed(1)}s`);

printTable("damage per turn by specialty", [...IDENTITY_COLUMNS, ...damageColumns()], rooms);
printTable("specialty weapon unavailable, % of runs drawn", [...IDENTITY_COLUMNS, ...unavailableColumns()], rooms);
printTable("offensive attributes available per character", [...IDENTITY_COLUMNS, ...AVAILABILITY_COLUMNS], rooms);
printSpecialtyAllocations(rooms);
