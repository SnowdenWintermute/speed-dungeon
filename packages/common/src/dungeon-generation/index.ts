import { DungeonRoom, DungeonRoomType } from "../adventuring-party/dungeon-room.js";
import { Combatant } from "../combatants/index.js";
import { ItemGenerator } from "../items/item-creation/index.js";
import { IdGenerator } from "../utility-classes/index.js";
import { RandomNumberGenerator } from "../utility-classes/randomizers.js";

export type DungeonGenerationPolicyConstructor = new (
  idGenerator: IdGenerator,
  itemGenerator: ItemGenerator,
  randomNumberGenerator: RandomNumberGenerator
) => DungeonGenerationPolicy;

export abstract class DungeonGenerationPolicy {
  constructor(
    protected readonly idGenerator: IdGenerator,
    protected readonly itemGenerator: ItemGenerator,
    protected readonly randomNumberGenerator: RandomNumberGenerator
  ) {}

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
