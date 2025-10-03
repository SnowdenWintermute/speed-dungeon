import { immerable } from "immer";
import { EntityId } from "../primatives/index.js";
import { DungeonRoom, DungeonRoomType } from "./dungeon-room.js";
import getCombatant from "./get-combatant-in-party.js";
import { getItemInAdventuringParty } from "./get-item-in-party.js";
import getCharacterIfOwned from "./get-character-if-owned.js";
import { removeCharacterFromParty } from "./remove-character-from-party.js";
import { generateUnexploredRoomsQueue } from "./generate-unexplored-rooms-queue.js";
import updatePlayerReadiness from "./update-player-readiness.js";
import playerOwnsCharacter from "./player-owns-character.js";
import { InputLock } from "./input-lock.js";
import { Combatant, CombatantCondition, CombatantProperties } from "../combatants/index.js";
import { ActionCommandQueue } from "../action-processing/action-command-queue.js";
import { SpeedDungeonGame } from "../game/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { ActionEntity, ActionEntityName } from "../action-entities/index.js";
import { Battle } from "../battle/index.js";
import { FriendOrFoe, TurnTrackerEntityType } from "../combat/index.js";
export * from "./get-item-in-party.js";
export * from "./dungeon-room.js";
export * from "./update-player-readiness.js";
export * from "./input-lock.js";
export * from "./add-character-to-party.js";

export type RoomsExploredTracker = { total: number; onCurrentFloor: number };

export class AdventuringParty {
  [immerable] = true;

  // players
  playerUsernames: string[] = [];

  // character entities
  characters: Record<EntityId, Combatant> = {};
  characterPositions: EntityId[] = [];
  characterPets: Record<EntityId, Combatant> = {};
  characterPetPositions: EntityId[] = [];

  actionEntities: Record<EntityId, ActionEntity> = {};

  // dungeon exploration
  currentFloor: number = 1;
  roomsExplored: RoomsExploredTracker = { total: 0, onCurrentFloor: 1 };
  unexploredRooms: DungeonRoomType[] = [];
  clientCurrentFloorRoomsList: (null | DungeonRoomType)[] = [];
  playersReadyToExplore: string[] = [];
  playersReadyToDescend: string[] = [];

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

  static removeCharacter = removeCharacterFromParty;
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
  static getItem = getItemInAdventuringParty;
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

  static registerActionEntity(
    party: AdventuringParty,
    entity: ActionEntity,
    battleOption: null | Battle
  ) {
    const { entityProperties } = entity;
    party.actionEntities[entityProperties.id] = entity;

    const turnOrderSpeedOption = entity.actionEntityProperties.actionOriginData?.turnOrderSpeed;
    if (battleOption && turnOrderSpeedOption !== undefined) {
      // account for how long the battle has been going for
      const fastestSchedulerDelay =
        battleOption.turnOrderManager.turnSchedulerManager.getFirstScheduler().accumulatedDelay;

      const startingDelay = turnOrderSpeedOption + fastestSchedulerDelay;

      battleOption.turnOrderManager.turnSchedulerManager.addNewScheduler(
        { type: TurnTrackerEntityType.ActionEntity, actionEntityId: entity.entityProperties.id },
        startingDelay
      );
    }
  }
  static unregisterActionEntity(
    party: AdventuringParty,
    entityId: EntityId,
    battleOption: null | Battle
  ) {
    delete party.actionEntities[entityId];
  }

  static getActionEntity(party: AdventuringParty, entityId: EntityId) {
    const entityOption = party.actionEntities[entityId];
    if (entityOption === undefined) return new Error(ERROR_MESSAGES.ACTION_ENTITIES.NOT_FOUND);
    return entityOption;
  }

  static getExistingActionEntityOfType(
    party: AdventuringParty,
    actionEntityType: ActionEntityName
  ) {
    for (const actionEntity of Object.values(party.actionEntities)) {
      if (actionEntity.actionEntityProperties.name === actionEntityType) return actionEntity;
    }
    return null;
  }

  static unregisterActionEntitiesOnBattleEndOrNewRoom(
    party: AdventuringParty,
    battleOption: null | Battle
  ) {
    const removed = [];
    for (const [key, entity] of Object.entries(party.actionEntities)) {
      removed.push(entity.entityProperties.id);
      AdventuringParty.unregisterActionEntity(party, key, battleOption);
    }

    return removed;
  }
}
