import { DungeonRoom, DungeonRoomType } from "../adventuring-party/dungeon-room.js";
import { Combatant } from "../combatants/index.js";
import { CombatantBuilder } from "../combatants/combatant-builder.js";
import { ItemBuilder } from "../items/item-creation/item-builder/index.js";
import { MonsterType } from "../monsters/monster-types.js";
import { IdGenerator } from "../utility-classes/index.js";
import { RandomNumberGenerationPolicy } from "../utility-classes/random-number-generation-policy.js";
import { MonsterSpawnEntry } from "./monster-types-by-floor.js";

export interface ExplicitCombatantRoomTemplate {
  type: DungeonRoomType;
  combatants?: ((
    idGenerator: IdGenerator,
    itemBuilder: ItemBuilder,
    rngPolicy: RandomNumberGenerationPolicy
  ) => CombatantBuilder)[];
}

export type ExplicitCombatantDungeonTemplate = ExplicitCombatantRoomTemplate[][];

export type DungeonGenerationPolicyConstructor = new (
  idGenerator: IdGenerator,
  itemBuilder: ItemBuilder,
  rngPolicy: RandomNumberGenerationPolicy
) => DungeonGenerationPolicy;

export abstract class DungeonGenerationPolicy {
  constructor(
    protected readonly idGenerator: IdGenerator,
    protected readonly itemBuilder: ItemBuilder,
    protected readonly rngPolicy: RandomNumberGenerationPolicy
  ) {}

  /** we set floors after construction so the game server can construct this with its own arugments, otherwise
   * we would have to construct this outside the game server when setting up what floors we want*/
  abstract setExplicitFloors(floors: ExplicitCombatantDungeonTemplate): void;
  abstract generateUnexploredRoomTypesOnFloor(
    floorLevel: number,
    includeBossRoom: boolean
  ): DungeonRoomType[];
  abstract generateFloorPalette(floorLevel: number): FloorPaletteSelection;
  abstract generateDungeonRoom(
    floorLevel: number,
    roomType: DungeonRoomType,
    roomIndex: number,
    palette: MonsterSpawnEntry[],
    boss: MonsterType | null
  ): DungeonRoomWithMonsters;
}

export interface FloorPaletteSelection {
  palette: MonsterSpawnEntry[];
  boss: MonsterType | null;
}

export interface DungeonRoomWithMonsters {
  room: DungeonRoom;
  monsters: Combatant[];
}
