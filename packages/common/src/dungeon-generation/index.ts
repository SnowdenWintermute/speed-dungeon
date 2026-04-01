import { DungeonRoom, DungeonRoomType } from "../adventuring-party/dungeon-room.js";
import { Combatant } from "../combatants/index.js";
import { ItemBuilder } from "../items/item-creation/item-builder/index.js";
import { IdGenerator } from "../utility-classes/index.js";
import { RandomNumberGenerator } from "../utility-classes/randomizers.js";

export interface ScriptedRoom {
  type: DungeonRoomType;
  monsters?: Combatant[];
}

export type DungeonGenerationPolicyConstructor = new (
  idGenerator: IdGenerator,
  itemBuilder: ItemBuilder,
  randomNumberGenerator: RandomNumberGenerator
) => DungeonGenerationPolicy;

export abstract class DungeonGenerationPolicy {
  constructor(
    protected readonly idGenerator: IdGenerator,
    protected readonly itemBuilder: ItemBuilder,
    protected readonly randomNumberGenerator: RandomNumberGenerator
  ) {}

  abstract setFloors(floors: ScriptedRoom[][]): void;
  abstract generateUnexploredRoomTypesOnFloor(floorLevel: number): DungeonRoomType[];
  abstract generateDungeonRoom(
    floorLevel: number,
    roomType: DungeonRoomType,
    roomIndex: number
  ): DungeonRoomWithMonsters;
}

export interface DungeonRoomWithMonsters {
  room: DungeonRoom;
  monsters: Combatant[];
}
