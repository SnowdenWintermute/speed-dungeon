import {
  GameId,
  IdentityProviderId,
  LadderCharacterFloorClearRecordId,
  LadderPartyFloorClearRecordId,
  Milliseconds,
  Username,
} from "../../aliases.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { invariant } from "../../utils/index.js";
import {
  LadderCharacterFloorClearRecord,
  LadderCharacterRecord,
  LadderParticipantRecord,
  LadderPartyFloorClearRecord,
  LadderPartyRecord,
} from "./index.js";
import { DateRange } from "../../primatives/date-range.js";
import {
  LadderGameRecordAggregate,
  LadderPartyFateUpdate,
  LadderRecordsPersistenceStrategy,
  NewLadderGameRecordSet,
  UserGameHistoryEntry,
} from "./ladder-records-persistence-strategy.js";
import { AdventuringParty } from "../../adventuring-party/index.js";
import { CharacterControlScheme } from "../index.js";
import cloneDeep from "lodash.clonedeep";
import { SerializedOf } from "../../serialization/index.js";
import { Combatant } from "../../combatants/index.js";
import { SerializedCombatantWithPets } from "../../servers/services/user-game-data-persistence/serialized-combatant-with-pets.js";
import { APP_VERSION_NUMBER } from "../../app-consts.js";

export class LadderGameRecordsService {
  constructor(
    private readonly persistenceStrategy: LadderRecordsPersistenceStrategy,
    private readonly idGenerator: IdGenerator
  ) {}

  async findParticipantRecordById(
    userId: IdentityProviderId
  ): Promise<LadderParticipantRecord | undefined> {
    return this.persistenceStrategy.findParticipantRecordById(userId);
  }

  async upsertParticipantRecord(record: LadderParticipantRecord): Promise<void> {
    return this.persistenceStrategy.upsertParticipantRecord(record);
  }

  async recordNewGame(
    game: SpeedDungeonGame,
    usernamesToAuthIds: Map<Username, IdentityProviderId>
  ): Promise<void> {
    const participantRecords: LadderParticipantRecord[] = [];
    for (const [_, userId] of usernamesToAuthIds) {
      const participantRecord: LadderParticipantRecord = {
        id: userId,
      };
      participantRecords.push(participantRecord);
    }

    const characters: LadderCharacterRecord[] = this.createCharacterRecords(
      game,
      usernamesToAuthIds
    );

    const newRecords: NewLadderGameRecordSet = {
      participantRecords,
      game: {
        id: game.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        name: game.name,
        mode: game.mode,
        controlScheme: game.characterControlScheme,
        timeStarted: game.clock.requireFirstStartedAt(),
      },
      parties: [...game.adventuringParties].map(([_, party]) => {
        const partyRecord: LadderPartyRecord = {
          id: party.id,
          name: party.name,
          gameRecordId: game.id,
          fateOption: undefined,
          deepestFloorReached: party.dungeonExplorationManager.getCurrentFloor(),
        };
        return partyRecord;
      }),
      characters,
    };

    // participant records are global per user; ensure they exist before inserting the game records
    // that reference them (the database enforces this with a foreign key)
    for (const participantRecord of participantRecords) {
      await this.persistenceStrategy.upsertParticipantRecord(participantRecord);
    }

    return this.persistenceStrategy.insertNewGameRecordSet(newRecords);
  }

  async updateGameRecordAggregate(
    game: SpeedDungeonGame,
    usernamesToAuthIds: Map<Username, IdentityProviderId>
  ) {
    await this.updateCharacterRecords(game, usernamesToAuthIds);

    const existingRecord = await this.persistenceStrategy.findGameRecordAggregateById(game.id);
    invariant(existingRecord !== undefined, "expected to have an existing game record");
    await this.persistenceStrategy.updateGameRecord({
      ...existingRecord.game,
      updatedAt: Date.now(),
    });

    for (const [_, party] of game.adventuringParties) {
      const existingRecord = await this.persistenceStrategy.findPartyRecordById(party.id);
      invariant(existingRecord !== undefined, "expected to have existing party record");
      const updated: LadderPartyRecord = {
        ...existingRecord,
        fateOption: party.fate || undefined,
        deepestFloorReached: Math.max(
          existingRecord.deepestFloorReached,
          party.dungeonExplorationManager.getCurrentFloor()
        ),
      };
      await this.persistenceStrategy.updatePartyRecord(updated);
    }
  }

  private createCharacterRecords(
    game: SpeedDungeonGame,
    usernamesToAuthIds: Map<Username, IdentityProviderId>
  ) {
    const characters: LadderCharacterRecord[] = [];
    for (const [_, party] of game.adventuringParties) {
      for (const combatant of party.combatantManager.getPartyMemberCharacters()) {
        const { classProgressionProperties, controlledBy } = combatant.combatantProperties;
        const controllingPlayerId = usernamesToAuthIds.get(controlledBy.controllerPlayerName);
        invariant(
          controllingPlayerId !== undefined,
          "expected to have the controlling player's id in the map"
        );

        const mainClass = classProgressionProperties.getMainClass();
        const supportClass = classProgressionProperties.getSupportClassOption();
        const record: LadderCharacterRecord = {
          id: combatant.getEntityId(),
          name: combatant.getName(),
          mainClass: { combatantClass: mainClass.combatantClass, level: mainClass.level },
          supportClassOption:
            supportClass === null
              ? undefined
              : { combatantClass: supportClass.combatantClass, level: supportClass.level },
          controllingPlayerId,
          partyRecordId: party.id,
        };
        characters.push(record);
      }
    }

    return characters;
  }

  private updateCharacterRecords(
    game: SpeedDungeonGame,
    usernamesToAuthIds: Map<Username, IdentityProviderId>
  ) {
    const characterUpdatePromises: Promise<void>[] = [];
    const characterRecords = this.createCharacterRecords(game, usernamesToAuthIds);
    for (const record of characterRecords) {
      characterUpdatePromises.push(this.persistenceStrategy.updateCharacterRecord(record));
    }

    return Promise.all(characterUpdatePromises);
  }

  async recordPartyFloorClear(
    party: AdventuringParty,
    clearedFloor: number,
    timeSpentOnFloorMs: Milliseconds,
    controlScheme: CharacterControlScheme
  ): Promise<void> {
    const partyFloorClearRecord: LadderPartyFloorClearRecord = {
      id: this.idGenerator.generate() as LadderPartyFloorClearRecordId,
      partyRecordRef: party.id,
      floor: clearedFloor,
      timeSpentOnFloor: timeSpentOnFloorMs,
      controlScheme,
    };

    const characterFloorClearRecords = this.createCharacterFloorClearRecords(
      party,
      partyFloorClearRecord.id
    );

    await this.persistenceStrategy.recordPartyFloorClear(
      partyFloorClearRecord,
      characterFloorClearRecords
    );
  }

  private createCharacterFloorClearRecords(
    party: AdventuringParty,
    floorClearRecordId: LadderPartyFloorClearRecordId
  ) {
    const records: LadderCharacterFloorClearRecord[] = [];

    for (const character of party.combatantManager.getPartyMemberCharacters()) {
      const combatantLessInventory = cloneDeep(character);
      combatantLessInventory.combatantProperties.inventory.deleteAllItems();
      const petsLessInventories: SerializedOf<Combatant>[] = [];
      const pets = party.petManager.getAllPetsByOwnerId(character.getEntityId());

      for (const pet of pets) {
        const petLessInventory = cloneDeep(pet);
        petLessInventory.combatantProperties.inventory.deleteAllItems();
        petsLessInventories.push(petLessInventory.toSerialized());
      }

      const combatantWithPets: SerializedCombatantWithPets = {
        combatant: combatantLessInventory.toSerialized(),
        pets: petsLessInventories,
      };

      const characterFloorClearRecord: LadderCharacterFloorClearRecord = {
        id: this.idGenerator.generate() as LadderCharacterFloorClearRecordId,
        combatantSchemaVersion: APP_VERSION_NUMBER,
        partyFloorClearRecord: floorClearRecordId,
        characterRecordRef: character.getEntityId(),
        combatantWithPets,
      };

      records.push(characterFloorClearRecord);
    }

    return records;
  }

  async updatePartyFate(update: LadderPartyFateUpdate): Promise<void> {
    return this.persistenceStrategy.updatePartyFate(update);
  }

  async recordRunAbandonment(
    gameId: GameId,
    participantRecordId: IdentityProviderId,
    timestamp: Milliseconds
  ): Promise<void> {
    return this.persistenceStrategy.recordRunAbandonment(gameId, participantRecordId, timestamp);
  }

  async refreshCharacterRecordOwnership(
    game: SpeedDungeonGame,
    usernamesToAuthIds: Map<Username, IdentityProviderId>
  ): Promise<void> {
    await this.updateCharacterRecords(game, usernamesToAuthIds);
  }

  async updateGameRecordControlScheme(
    gameId: GameId,
    controlScheme: CharacterControlScheme
  ): Promise<void> {
    return this.persistenceStrategy.updateGameRecordControlScheme(gameId, controlScheme);
  }

  async getGameRecordAggregate(id: GameId): Promise<LadderGameRecordAggregate | undefined> {
    return this.persistenceStrategy.findGameRecordAggregateById(id);
  }

  async requireGameRecordAggregate(id: GameId): Promise<LadderGameRecordAggregate> {
    const expected = await this.getGameRecordAggregate(id);
    invariant(expected !== undefined, "expected game record to exist");
    return expected;
  }

  async getUserGameHistory(
    userId: IdentityProviderId,
    page: number,
    dateRange?: DateRange
  ): Promise<UserGameHistoryEntry[]> {
    return this.persistenceStrategy.getUserGameHistory(userId, page, dateRange);
  }

  async getUserGameRecordsCount(
    userId: IdentityProviderId,
    dateRange?: DateRange
  ): Promise<number> {
    return this.persistenceStrategy.getUserGameRecordsCount(userId, dateRange);
  }
}
