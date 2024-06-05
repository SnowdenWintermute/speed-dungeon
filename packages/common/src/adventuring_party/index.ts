import { immerable } from "immer";
import { EntityId } from "../primatives";
import { PlayerCharacter } from "./player-character";
import { DungeonRoom, DungeonRoomType } from "./dungeon-room";
import getCombatant from "./get-combatant-in-party";
import getItemInAdventuringParty from "./get-item-in-party";
import getIdsAndSelectedActionsOfCharactersTargetingCombatant from "./get-ids-and-selected-actions-of-characters-targeting-combatant";
import getMonsterIdsInParty from "./get-monster-ids-in-party";
import getCharacterIfOwned from "./get-character-if-owned";
import removeCharacterFromParty from "./remove-character-from-party";
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

  static removeCharacter = removeCharacterFromParty;
  static getCombatant = getCombatant;
  static getItem = getItemInAdventuringParty;
  static getIdsAndSelectedActionsOfCharactersTargetingCombatant =
    getIdsAndSelectedActionsOfCharactersTargetingCombatant;
  static getMonsterIds = getMonsterIdsInParty;
  static getCharacterIfOwned = getCharacterIfOwned;
}
