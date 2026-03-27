import { DungeonRoom, DungeonRoomType } from "./dungeon-room.js";
import { SpeedDungeonGame } from "../game/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { DungeonExplorationManager } from "./dungeon-exploration-manager.js";
import { ActionEntityManager } from "./action-entity-manager.js";
import { PetManager } from "./pet-manager.js";
import { CombatantManager } from "./combatant-manager.js";
import { Combatant } from "../combatants/index.js";
import { ArrayUtils } from "../utils/array-utils.js";
import { makeAutoObservable } from "mobx";
import { Item } from "../items/index.js";
import { AdventuringPartySubsystem } from "./party-subsystem.js";
import { CombatantId, EntityId, PartyName, Username } from "../aliases.js";
import { SpeedDungeonPlayer } from "../game/player.js";
import { TimedLock } from "../primatives/timed-lock.js";
import {
  ReactiveNode,
  Serializable,
  SerializedOf,
  makePropertiesObservable,
} from "../serialization/index.js";
import { MapUtils } from "../utils/map-utils.js";

export class AdventuringParty implements Serializable, ReactiveNode {
  // subsystems
  actionEntityManager = new ActionEntityManager();
  dungeonExplorationManager = new DungeonExplorationManager();
  petManager = new PetManager();
  combatantManager = new CombatantManager();
  // other
  playerUsernames: Username[] = [];
  currentRoom: DungeonRoom = new DungeonRoom(DungeonRoomType.Empty);
  battleId: null | EntityId = null;
  timeOfWipe: null | number = null;
  timeOfEscape: null | number = null;
  itemsOnGroundNotYetReceivedByAllClients = new Map<EntityId, EntityId[]>();
  inputLock = new TimedLock();

  constructor(
    public id: string,
    public name: PartyName
  ) {}

  makeObservable() {
    makeAutoObservable(this);
    makePropertiesObservable(this);
  }

  static createInitialized(id: EntityId, name: string) {
    const party = new AdventuringParty(id, name as PartyName);
    party.initialize();
    return party;
  }

  toSerialized() {
    return {
      id: this.id,
      name: this.name,
      actionEntityManager: this.actionEntityManager.toSerialized(),
      dungeonExplorationManager: this.dungeonExplorationManager.toSerialized(),
      petManager: this.petManager.toSerialized(),
      combatantManager: this.combatantManager.toSerialized(),
      playerUsernames: this.playerUsernames,
      currentRoom: this.currentRoom.toSerialized(),
      battleId: this.battleId,
      timeOfWipe: this.timeOfWipe,
      timeOfEscape: this.timeOfEscape,
      itemsOnGroundNotYetReceivedByAllClients: MapUtils.serialize(
        this.itemsOnGroundNotYetReceivedByAllClients
      ),
      inputLock: this.inputLock.toSerialized(),
    };
  }

  static fromSerialized(serialized: SerializedOf<AdventuringParty>) {
    const result = new AdventuringParty(serialized.id, serialized.name);

    result.actionEntityManager = ActionEntityManager.fromSerialized(serialized.actionEntityManager);
    result.dungeonExplorationManager = DungeonExplorationManager.fromSerialized(
      serialized.dungeonExplorationManager
    );
    result.petManager = PetManager.fromSerialized(serialized.petManager);
    result.combatantManager = CombatantManager.fromSerialized(serialized.combatantManager);
    result.playerUsernames = serialized.playerUsernames;
    result.currentRoom = DungeonRoom.fromSerialized(serialized.currentRoom);
    result.battleId = serialized.battleId;
    result.timeOfWipe = serialized.timeOfWipe;
    result.timeOfEscape = serialized.timeOfEscape;
    result.itemsOnGroundNotYetReceivedByAllClients = MapUtils.deserialize(
      serialized.itemsOnGroundNotYetReceivedByAllClients
    );
    result.inputLock = TimedLock.fromSerialized(serialized.inputLock);
    result.initialize();

    return result;
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

    for (const combatant of this.combatantManager.iterateAllCombatants()) {
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
    if (battleIdOption === null) {
      return null;
    }
    return game.getExpectedBattle(battleIdOption);
  }

  isInCombat() {
    return this.combatantManager.monstersArePresent();
  }

  requireNotInCombat() {
    if (this.isInCombat()) {
      throw new Error(ERROR_MESSAGES.PARTY.CANT_EXPLORE_WHILE_MONSTERS_ARE_PRESENT);
    }
  }

  removeCharacter(
    characterId: CombatantId,
    player: SpeedDungeonPlayer,
    game: SpeedDungeonGame
  ): Combatant {
    ArrayUtils.removeElement(player.characterIds, characterId);
    const character = this.combatantManager.removeCombatant(characterId, game);
    const summonedPetOption = this.petManager.getCombatantSummonedPetOption(
      character.getEntityId()
    );
    if (summonedPetOption) {
      this.petManager.unsummonPet(summonedPetOption.getEntityId(), game);
      this.petManager.clearCombatantPets(characterId);
    }
    return character;
  }

  setCurrentRoom(room: DungeonRoom) {
    this.currentRoom = room;
  }

  requireInputUnlocked() {
    if (this.inputLock.isLocked()) {
      throw new Error(ERROR_MESSAGES.PARTY.INPUT_IS_LOCKED);
    }
  }

  requireDescentPermitted() {
    this.requireNotInCombat();
    this.currentRoom.requireType(DungeonRoomType.Staircase);
  }
}
