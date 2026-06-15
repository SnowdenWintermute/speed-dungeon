import { GameId, IdentityProviderId, LadderParticipantRecordId } from "../../aliases.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { LadderParticipantRecord } from "./index.js";
import {
  LadderGameRecordAggregate,
  LadderPartyFateUpdate,
  LadderPartyFloorClearWrite,
  LadderPartyRecordInsert,
  LadderRecordsPersistenceStrategy,
  NewLadderGameRecordSet,
} from "./ladder-records-persistence-strategy.js";

export class LadderGameRecordsService {
  constructor(
    private readonly persistenceStrategy: LadderRecordsPersistenceStrategy,
    private readonly idGenerator: IdGenerator
  ) {}

  async findParticipantRecordByUserId(
    userId: IdentityProviderId
  ): Promise<LadderParticipantRecord | undefined> {
    return this.persistenceStrategy.findParticipantRecordByUserId(userId);
  }

  async upsertParticipantRecord(record: LadderParticipantRecord): Promise<void> {
    return this.persistenceStrategy.upsertParticipantRecord(record);
  }

  async recordNewGame(game: SpeedDungeonGame, userIds: IdentityProviderId[]): Promise<void> {
    const participantRecords: LadderParticipantRecord[] = [];
    for (const userId of userIds) {
      const participantRecord: LadderParticipantRecord = {
        id: this.idGenerator.generate() as LadderParticipantRecordId,
        userId,
      };
      participantRecords.push(participantRecord);
    }

    const newRecords: NewLadderGameRecordSet = {
      participantRecords,
      game: {
        id: game.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        name: game.name,
        mode: game.mode,
        controlScheme: game.characterControlScheme,
        timeStarted: 0,
      },
      parties: [...game.adventuringParties].map(([_, party]) => {
        const recordInsert: LadderPartyRecordInsert = {
          id: party.id,
          name: party.name,
          gameRecordId: game.id,
          fateOption: undefined,
          deepestFloorReached: 1,
        };
        return recordInsert;
      }),
      characters: [],
    };

    return this.persistenceStrategy.insertNewGameRecordSet(newRecords);
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
}
