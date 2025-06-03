import { immerable } from "immer";
import { EntityId } from "../primatives/index.js";
import { DungeonRoom, DungeonRoomType } from "./dungeon-room.js";
import getCombatant from "./get-combatant-in-party.js";
import { getItemInAdventuringParty } from "./get-item-in-party.js";
import { getIdsAndSelectedActionsOfCharactersTargetingCombatant } from "./get-ids-and-selected-actions-of-characters-targeting-combatant.js";
import getCharacterIfOwned from "./get-character-if-owned.js";
import removeCharacterFromParty from "./remove-character-from-party.js";
import { generateUnexploredRoomsQueue } from "./generate-unexplored-rooms-queue.js";
import updatePlayerReadiness from "./update-player-readiness.js";
import playerOwnsCharacter from "./player-owns-character.js";
import { InputLock } from "./input-lock.js";
import { Combatant } from "../combatants/index.js";
import { ActionCommandQueue } from "../action-processing/action-command-queue.js";
import { SpeedDungeonGame } from "../game/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
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
  currentRoom: DungeonRoom = new DungeonRoom(DungeonRoomType.Empty, {}, []);
  unexploredRooms: DungeonRoomType[] = [];
  clientCurrentFloorRoomsList: (null | DungeonRoomType)[] = [];
  battleId: null | EntityId = null;
  timeOfWipe: null | number = null;
  timeOfEscape: null | number = null;
  itemsOnGroundNotYetReceivedByAllClients: { [id: EntityId]: EntityId[] } = {};
  actionCommandQueue: ActionCommandQueue = new ActionCommandQueue();
  inputLock: InputLock = new InputLock();

  constructor(
    public id: string,
    public name: string
  ) {}

  static removeCharacter = removeCharacterFromParty;
  static getCombatant = getCombatant;
  static getItem = getItemInAdventuringParty;
  static getIdsAndSelectedActionsOfCharactersTargetingCombatant =
    getIdsAndSelectedActionsOfCharactersTargetingCombatant;
  static getCharacterIfOwned = getCharacterIfOwned;
  generateUnexploredRoomsQueue = generateUnexploredRoomsQueue;
  static updatePlayerReadiness = updatePlayerReadiness;
  static playerOwnsCharacter = playerOwnsCharacter;
  static getAllCombatants(party: AdventuringParty) {
    return { characters: party.characters, monsters: party.currentRoom.monsters };
  }

  static getBattleOption(party: AdventuringParty, game: SpeedDungeonGame) {
    const battleIdOption = party.battleId;
    if (battleIdOption === null) return null;
    const battleOption = game.battles[battleIdOption];
    if (!battleOption) throw new Error(ERROR_MESSAGES.GAME.BATTLE_DOES_NOT_EXIST);
    return battleOption;
  }
}
