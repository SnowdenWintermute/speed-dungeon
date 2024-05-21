import { immerable } from "immer";
import { EntityId } from "../primatives";
import applyFullUpdate from "./apply-full-update";
import { PlayerCharacter } from "./player-character";
import removeCharacter from "./remove-character";
import { DungeonRoom, DungeonRoomType } from "./dungeon-room";
import getCombatant from "./get-combatant";
import getItemInAdventuringParty from "./getItem";
export * from "./player-character";

export type RoomsExploredTracker = { total: number; onCurrentFloor: number };

export class AdventuringParty {
  [immerable] = true;
  playerUsernames: string[] = [];
  playersReadyToExplore: string[] = [];
  playersReadyToDescend: string[] = [];
  characters: { [id: string]: PlayerCharacter } = {};
  characterPositions: string[] = [];
  currentFloor: number = 1;
  roomsExplored: RoomsExploredTracker = { total: 1, onCurrentFloor: 1 };
  currentRoom: DungeonRoom = new DungeonRoom(DungeonRoomType.Empty, {});
  unexploredRooms: DungeonRoomType[] = [];
  clientCurrentFloorRoomsList: (null | DungeonRoomType)[] = [];
  battleId: null | EntityId = null;
  timeOfWipe: null | number = null;
  timeOfEscape: null | number = null;
  itemsOnGroundNotYetReceivedByAllClients: { [id: EntityId]: EntityId[] } = {};

  constructor(public name: string) {}

  applyFullUpdate = applyFullUpdate;
  removeCharacter = removeCharacter;
  getCombatant = getCombatant;
  getItem = getItemInAdventuringParty;
}
