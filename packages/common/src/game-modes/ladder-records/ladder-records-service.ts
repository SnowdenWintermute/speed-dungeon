import {
  IdentityProviderId,
  LadderGameRecordId,
  LadderParticipantRecordId,
  LadderPartyRecordId,
  Username,
} from "../../aliases.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { invariant } from "../../utils/index.js";
import { LadderParticipantRecord } from "./index.js";
import {
  LadderGameRecordAggregate,
  LadderPartyFateUpdate,
  LadderPartyFloorClearWrite,
  LadderRecordsPersistenceStrategy,
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

  async recordNewGame(
    game: SpeedDungeonGame,
    usernamesToUserIds: Map<Username, IdentityProviderId>
  ): Promise<void> {
    const participantRecords: LadderParticipantRecord[] = [];
    for (const [username, player] of game.players) {
      const userId = usernamesToUserIds.get(username);
      invariant(userId !== undefined, "expected a complete Map<Username, IdentityProviderId>");
      const participantRecord: LadderParticipantRecord = {
        id: this.idGenerator.generate() as LadderParticipantRecordId,
        userId,
      };
      participantRecords.push(participantRecord);
    }

    // return this.persistenceStrategy.insertNewGameRecordSet(recordSet);
  }

  async recordPartyFloorClear(write: LadderPartyFloorClearWrite): Promise<void> {
    return this.persistenceStrategy.recordPartyFloorClear(write);
  }

  async updatePartyFate(update: LadderPartyFateUpdate): Promise<void> {
    return this.persistenceStrategy.updatePartyFate(update);
  }

  async getGameRecordAggregate(
    id: LadderGameRecordId
  ): Promise<LadderGameRecordAggregate | undefined> {
    return this.persistenceStrategy.findGameRecordAggregateById(id);
  }
}
