import { IdentityProviderId, LadderGameRecordId } from "../../aliases.js";
import { LadderParticipantRecord } from "./index.js";
import {
  LadderGameRecordAggregate,
  LadderPartyFateUpdate,
  LadderPartyFloorClearWrite,
  LadderRecordsPersistenceStrategy,
  NewLadderGameRecordSet,
} from "./ladder-records-persistence-strategy.js";

export class LadderGameRecordsService {
  constructor(private readonly persistenceStrategy: LadderRecordsPersistenceStrategy) {}

  async findParticipantRecordByUserId(
    userId: IdentityProviderId
  ): Promise<LadderParticipantRecord | undefined> {
    return this.persistenceStrategy.findParticipantRecordByUserId(userId);
  }

  async upsertParticipantRecord(record: LadderParticipantRecord): Promise<void> {
    return this.persistenceStrategy.upsertParticipantRecord(record);
  }

  async recordNewGame(recordSet: NewLadderGameRecordSet): Promise<void> {
    return this.persistenceStrategy.insertNewGameRecordSet(recordSet);
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
