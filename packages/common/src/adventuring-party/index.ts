import { EntityId } from "../primatives/index.js";
import { DungeonRoom, DungeonRoomType } from "./dungeon-room.js";
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
import { Item } from "../items/index.js";
import { AdventuringPartySubsystem } from "./party-subsystem.js";
import { plainToInstance } from "class-transformer";
export * from "./dungeon-room.js";
export * from "./dungeon-exploration-manager.js";
export * from "./input-lock.js";

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
    runIfInBrowser(() => makeAutoObservable(this));
  }

  static createInitialized(id: EntityId, name: string) {
    const party = new AdventuringParty(id, name);
    party.initialize();
    return party;
  }

  static getDeserialized(plain: AdventuringParty) {
    const toReturn = plainToInstance(AdventuringParty, plain);
    toReturn.combatantManager = CombatantManager.getDeserialized(toReturn.combatantManager);
    toReturn.currentRoom = DungeonRoom.getDeserialized(toReturn.currentRoom);
    toReturn.inputLock = InputLock.getDeserialized(toReturn.inputLock);
    toReturn.dungeonExplorationManager = DungeonExplorationManager.getDeserialized(
      toReturn.dungeonExplorationManager
    );
    toReturn.petManager = PetManager.getDeserialized(toReturn.petManager);
    toReturn.actionEntityManager = ActionEntityManager.getDeserialized(
      toReturn.actionEntityManager
    );

    toReturn.actionCommandQueue = ActionCommandQueue.getDeserialized(toReturn.actionCommandQueue);

    toReturn.initialize();

    return toReturn;
  }

  initialize() {
    for (const value of Object.values(this)) {
      const isSubsystem = value instanceof AdventuringPartySubsystem;
      if (!isSubsystem) continue;
      value.initialize(this);
    }
  }

  getItem(itemId: string) {
    let toReturn: undefined | Item;

    for (const combatant of this.combatantManager.getAllCombatants()) {
      const itemResult = combatant.combatantProperties.inventory.getStoredOrEquipped(itemId);
      if (itemResult instanceof Error) continue;
      toReturn = itemResult;
      if (toReturn) return toReturn;
    }

    const maybeItem = this.currentRoom.inventory.getItemById(itemId);
    if (!(maybeItem instanceof Error)) return maybeItem;

    return new Error(ERROR_MESSAGES.ITEM.NOT_FOUND);
  }

  getBattleOption(game: SpeedDungeonGame) {
    const battleIdOption = this.battleId;
    if (battleIdOption === null) return null;
    const battleOption = game.battles[battleIdOption];
    if (!battleOption) throw new Error(ERROR_MESSAGES.GAME.BATTLE_DOES_NOT_EXIST);
    return battleOption;
  }

  isInCombat() {
    return this.combatantManager.monstersArePresent();
  }

  removeCharacter(
    characterId: EntityId,
    player: SpeedDungeonPlayer,
    game: SpeedDungeonGame
  ): Combatant {
    ArrayUtils.removeElement(player.characterIds, characterId);
    const character = this.combatantManager.removeCombatant(characterId, game);
    return character;
  }

  setCurrentRoom(room: DungeonRoom) {
    this.currentRoom = room;
  }
}
