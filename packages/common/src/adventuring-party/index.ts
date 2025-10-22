import { EntityId } from "../primatives/index.js";
import { DungeonRoom, DungeonRoomType } from "./dungeon-room.js";
import { getItemInAdventuringParty } from "./get-item-in-party.js";
import { InputLock } from "./input-lock.js";
import { ActionCommandQueue } from "../action-processing/action-command-queue.js";
import { SpeedDungeonGame, SpeedDungeonPlayer } from "../game/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { DungeonExplorationManager } from "./dungeon-exploration-manager.js";
import { ActionEntityManager } from "./action-entity-manager.js";
import { PetManager } from "./pet-manager.js";
import { CombatantManager } from "./combatant-manager.js";
import { Combatant } from "../combatants/index.js";
import { ArrayUtils } from "../utils/array-utils.js";
import { makeAutoObservable } from "mobx";
import { runIfInBrowser } from "../utils/index.js";
export * from "./get-item-in-party.js";
export * from "./dungeon-room.js";
export * from "./dungeon-exploration-manager.js";
export * from "./input-lock.js";
export * from "./add-character-to-party.js";

export class AdventuringParty {
  // subsystems
  actionEntityManager = new ActionEntityManager();
  dungeonExplorationManager = new DungeonExplorationManager();
  petManager = new PetManager();
  combatantManager = new CombatantManager();

  // players
  playerUsernames: string[] = [];

  // current room
  currentRoom: DungeonRoom = new DungeonRoom(DungeonRoomType.Empty);
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
  ) {
    runIfInBrowser(() => makeAutoObservable(this, {}, { autoBind: true }));
  }

  // ITEMS
  static getItem = getItemInAdventuringParty;

  static getBattleOption(party: AdventuringParty, game: SpeedDungeonGame) {
    const battleIdOption = party.battleId;
    if (battleIdOption === null) return null;
    const battleOption = game.battles[battleIdOption];
    if (!battleOption) throw new Error(ERROR_MESSAGES.GAME.BATTLE_DOES_NOT_EXIST);
    return battleOption;
  }

  removeCharacter(characterId: EntityId, player: SpeedDungeonPlayer): Combatant {
    ArrayUtils.removeElement(player.characterIds, characterId);
    const character = this.combatantManager.removeCombatant(characterId);
    return character;
  }

  setCurrentRoom(room: DungeonRoom) {
    this.currentRoom = room;
  }

  static getDeserialized(party: AdventuringParty) {
    const combatantManager = CombatantManager.getDeserialized(party.combatantManager);
    party.combatantManager = combatantManager;
    party.currentRoom = DungeonRoom.getDeserialized(party.currentRoom);

    return party;
  }
}
