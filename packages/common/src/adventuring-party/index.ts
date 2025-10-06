import { immerable } from "immer";
import { EntityId } from "../primatives/index.js";
import { DungeonRoom, DungeonRoomType } from "./dungeon-room.js";
import { getItemInAdventuringParty } from "./get-item-in-party.js";
import getCharacterIfOwned from "./get-character-if-owned.js";
import { removeCharacterFromParty } from "./remove-character-from-party.js";
import playerOwnsCharacter from "./player-owns-character.js";
import { InputLock } from "./input-lock.js";
import { ActionCommandQueue } from "../action-processing/action-command-queue.js";
import { SpeedDungeonGame } from "../game/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { DungeonExplorationManager } from "./dungeon-exploration-manager.js";
import { ActionEntityManager } from "./action-entity-manager.js";
import { PetManager } from "./pet-manager.js";
import { CombatantManager } from "./combatant-manager.js";
export * from "./get-item-in-party.js";
export * from "./dungeon-room.js";
export * from "./dungeon-exploration-manager.js";
export * from "./input-lock.js";
export * from "./add-character-to-party.js";

export class AdventuringParty {
  [immerable] = true;
  // subsystems
  actionEntityManager = new ActionEntityManager();
  dungeonExplorationManager = new DungeonExplorationManager();
  petManager = new PetManager();
  combatantManager = new CombatantManager();

  // players
  playerUsernames: string[] = [];

  // current room
  currentRoom: DungeonRoom = new DungeonRoom(DungeonRoomType.Empty, {}, []);
  battleId: null | EntityId = null;

  // party status
  timeOfWipe: null | number = null;
  timeOfEscape: null | number = null;

  // player input management
  itemsOnGroundNotYetReceivedByAllClients: { [id: EntityId]: EntityId[] } = {};
  inputLock: InputLock = new InputLock();

  // event management
  actionCommandQueue: ActionCommandQueue = new ActionCommandQueue();

  constructor(
    public id: string,
    public name: string
  ) {}

  // ITEMS
  static getItem = getItemInAdventuringParty;

  // PLAYER CHARACTERS
  static getCharacterIfOwned = getCharacterIfOwned;
  static playerOwnsCharacter = playerOwnsCharacter;
  static removeCharacter = removeCharacterFromParty;

  hasCharacters() {
    return Object.values(this.characters).length > 0;
  }

  static getBattleOption(party: AdventuringParty, game: SpeedDungeonGame) {
    const battleIdOption = party.battleId;
    if (battleIdOption === null) return null;
    const battleOption = game.battles[battleIdOption];
    if (!battleOption) throw new Error(ERROR_MESSAGES.GAME.BATTLE_DOES_NOT_EXIST);
    return battleOption;
  }
}
