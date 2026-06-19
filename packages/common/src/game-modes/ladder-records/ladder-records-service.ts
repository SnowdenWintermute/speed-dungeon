import { GameId, IdentityProviderId, Username } from "../../aliases.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { invariant } from "../../utils/index.js";
import {
  LadderCharacterRecord,
  LadderGameRecord,
  LadderParticipantRecord,
  LadderPartyRecord,
} from "./index.js";
import { DateRange } from "../../primatives/date-range.js";
import {
  LadderGameRecordAggregate,
  LadderPartyFateUpdate,
  LadderPartyFloorClearWrite,
  LadderRecordsPersistenceStrategy,
  NewLadderGameRecordSet,
  UserGameHistoryEntry,
} from "./ladder-records-persistence-strategy.js";

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

    return this.persistenceStrategy.insertNewGameRecordSet(newRecords);
  }

  async updateGameRecordAggregate(
    game: SpeedDungeonGame,
    usernamesToAuthIds: Map<Username, IdentityProviderId>
  ) {
    console.log("updating game record aggregate");
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
      console.log(
        "party:",
        party.name,
        "floor:",
        party.dungeonExplorationManager.getCurrentFloor()
      );
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

  async recordPartyFloorClear(write: LadderPartyFloorClearWrite): Promise<void> {
    return this.persistenceStrategy.recordPartyFloorClear(write);
  }

  async updatePartyFate(update: LadderPartyFateUpdate): Promise<void> {
    return this.persistenceStrategy.updatePartyFate(update);
  }

  async getGameRecordAggregate(id: GameId): Promise<LadderGameRecordAggregate | undefined> {
    return this.persistenceStrategy.findGameRecordAggregateById(id);
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
