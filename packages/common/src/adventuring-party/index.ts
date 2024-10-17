import { immerable } from "immer";
import { EntityId } from "../primatives/index.js";
import { DungeonRoom, DungeonRoomType } from "./dungeon-room.js";
import getCombatant from "./get-combatant-in-party.js";
import { getItemInAdventuringParty } from "./get-item-in-party.js";
import getIdsAndSelectedActionsOfCharactersTargetingCombatant from "./get-ids-and-selected-actions-of-characters-targeting-combatant.js";
import getMonsterIdsInParty from "./get-monster-ids-in-party.js";
import getCharacterIfOwned from "./get-character-if-owned.js";
import removeCharacterFromParty from "./remove-character-from-party.js";
import generateUnexploredRoomsQueue from "./generate-unexplored-rooms-queue.js";
import updatePlayerReadiness from "./update-player-readiness.js";
import playerOwnsCharacter from "./player-owns-character.js";
import { ActionCommandManager } from "../action-processing/action-command-manager.js";
import { InputLock } from "./input-lock.js";
import { Combatant } from "../combatants/index.js";
export * from "./get-item-in-party.js";
export * from "./dungeon-room.js";
export * from "./update-player-readiness.js";
export * from "./input-lock.js";
export * from "./add-character-to-party.js";

export type RoomsExploredTracker = { total: number; onCurrentFloor: number };

export class AdventuringParty {
  [immerable] = true;
  playerUsernames: string[] = [];
  playersReadyToExplore: string[] = [];
  playersReadyToDescend: string[] = [];
  characters: { [id: string]: Combatant } = {};
  characterPositions: string[] = [];
  currentFloor: number = 1;
  roomsExplored: RoomsExploredTracker = { total: 0, onCurrentFloor: 1 };
  currentRoom: DungeonRoom = new DungeonRoom(DungeonRoomType.Empty, {});
  unexploredRooms: DungeonRoomType[] = [];
  clientCurrentFloorRoomsList: (null | DungeonRoomType)[] = [];
  battleId: null | EntityId = null;
  timeOfWipe: null | number = null;
  timeOfEscape: null | number = null;
  itemsOnGroundNotYetReceivedByAllClients: { [id: EntityId]: EntityId[] } = {};
  actionCommandManager: ActionCommandManager = new ActionCommandManager();
  inputLock: InputLock = new InputLock();

  constructor(public name: string) {}

  static removeCharacter = removeCharacterFromParty;
  static getCombatant = getCombatant;
  static getItem = getItemInAdventuringParty;
  static getIdsAndSelectedActionsOfCharactersTargetingCombatant =
    getIdsAndSelectedActionsOfCharactersTargetingCombatant;
  static getMonsterIds = getMonsterIdsInParty;
  static getCharacterIfOwned = getCharacterIfOwned;
  generateUnexploredRoomsQueue = generateUnexploredRoomsQueue;
  static updatePlayerReadiness = updatePlayerReadiness;
  static playerOwnsCharacter = playerOwnsCharacter;
}
