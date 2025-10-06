import { immerable } from "immer";
import { EntityId } from "../primatives/index.js";
import { DungeonRoom, DungeonRoomType } from "./dungeon-room.js";
import getCombatant from "./get-combatant-in-party.js";
import { getItemInAdventuringParty } from "./get-item-in-party.js";
import getCharacterIfOwned from "./get-character-if-owned.js";
import { removeCharacterFromParty } from "./remove-character-from-party.js";
import playerOwnsCharacter from "./player-owns-character.js";
import { InputLock } from "./input-lock.js";
import { Combatant, CombatantCondition, CombatantProperties } from "../combatants/index.js";
import { ActionCommandQueue } from "../action-processing/action-command-queue.js";
import { SpeedDungeonGame } from "../game/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { FriendOrFoe } from "../combat/index.js";
import { DungeonExplorationManager } from "./dungeon-exploration-manager.js";
import { ActionEntityManager } from "./action-entity-manager.js";
export * from "./get-item-in-party.js";
export * from "./dungeon-room.js";
export * from "./dungeon-exploration-manager.js";
export * from "./input-lock.js";
export * from "./add-character-to-party.js";

// @REFACTOR - split properties into subsystem classes

export class AdventuringParty {
  [immerable] = true;
  // subsystems
  actionEntityManager = new ActionEntityManager();
  dungeonExplorationManager = new DungeonExplorationManager(this);

  // players
  playerUsernames: string[] = [];

  // character entities
  characters: Record<EntityId, Combatant> = {};
  characterPositions: EntityId[] = [];

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

  // COMBATANTS
  static getCombatant = getCombatant;

  static getAllCombatantIds(party: AdventuringParty) {
    return [...party.characterPositions, ...party.currentRoom.monsterPositions];
  }

  static getCombatants(party: AdventuringParty, entityIds: EntityId[]) {
    const toReturn: Combatant[] = [];

    for (const id of entityIds) {
      const opponentCombatantResult = AdventuringParty.getCombatant(party, id);
      if (opponentCombatantResult instanceof Error) {
        console.error(opponentCombatantResult);
        break;
      }
      toReturn.push(opponentCombatantResult);
    }

    return toReturn;
  }

  static getExpectedCombatant(party: AdventuringParty, combatantId: EntityId) {
    const combatantResult = AdventuringParty.getCombatant(party, combatantId);
    if (combatantResult instanceof Error) throw combatantResult;
    return combatantResult;
  }

  static getConditionOnCombatant(
    party: AdventuringParty,
    combatantId: EntityId,
    conditionId: EntityId
  ): Error | CombatantCondition {
    const combatantResult = AdventuringParty.getCombatant(party, combatantId);
    if (combatantResult instanceof Error) return combatantResult;
    const conditionOption = CombatantProperties.getConditionById(
      combatantResult.combatantProperties,
      conditionId
    );
    if (conditionOption === null)
      return new Error(
        `expected condition not found with id ${conditionId} on combatant id ${combatantId}`
      );
    return conditionOption;
  }

  // ITEMS
  static getItem = getItemInAdventuringParty;

  // PLAYER CHARACTERS
  static getCharacterIfOwned = getCharacterIfOwned;
  static playerOwnsCharacter = playerOwnsCharacter;
  static removeCharacter = removeCharacterFromParty;
  hasCharacters() {
    return Object.values(this.characters).length > 0;
  }

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

  static getCombatantIdsByDispositionTowardsCombatantId(
    party: AdventuringParty,
    combatantId: string
  ): Record<FriendOrFoe, EntityId[]> {
    if (party.characterPositions.includes(combatantId)) {
      return {
        [FriendOrFoe.Friendly]: party.characterPositions,
        [FriendOrFoe.Hostile]: party.currentRoom.monsterPositions,
      };
    } else if (party.currentRoom.monsterPositions.includes(combatantId)) {
      return {
        [FriendOrFoe.Friendly]: party.currentRoom.monsterPositions,
        [FriendOrFoe.Hostile]: party.characterPositions,
      };
    } else {
      throw new Error(ERROR_MESSAGES.COMBATANT.NOT_FOUND);
    }
  }
}
