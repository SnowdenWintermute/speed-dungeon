import { DungeonRoom, DungeonRoomType } from "../adventuring-party/dungeon-room.js";
import { Combatant } from "../combatants/index.js";
import { ItemBuilder } from "../items/item-creation/item-builder/index.js";
import { MonsterGenerator } from "../monsters/monster-generator.js";
import { MonsterType } from "../monsters/monster-types.js";
import { IdGenerator } from "../utility-classes/index.js";
import { RandomNumberGenerationPolicy } from "../utility-classes/random-number-generation-policy.js";

export interface MonsterGenerationProps {
  type: MonsterType;
  level: number;
}

export interface ScriptedRoomTemplate {
  type: DungeonRoomType;
  monsters?: MonsterGenerationProps[];
}

export type ScriptedDungeonTemplate = ScriptedRoomTemplate[][];

export interface ScriptedRoom {
  type: DungeonRoomType;
  monsters?: MonsterGenerationProps[];
}

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
  abstract setFloors(floors: ScriptedRoomTemplate[][], monsterGenerator: MonsterGenerator): void;
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
