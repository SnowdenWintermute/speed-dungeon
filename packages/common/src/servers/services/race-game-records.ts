import { GameId } from "../../aliases.js";
import { Combatant } from "../../combatants/index.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import {
  PartyFate,
  RaceGameAggregatedRecord,
} from "../game-server/controllers/game-lifecycle/record-types.js";

export interface RaceGamePartyRecord {
  id: number;
  gameRecordId: number;
  partyName: string;
  partyFate: null | PartyFate;
  partyFateRecordedAt: null | string;
  isWinner: boolean;
  deepestFloor: number;
}

export interface RaceGameRecordsPersistenceStrategy {
  insert: (game: SpeedDungeonGame) => Promise<void>;
  markGameCompleted: (gameId: GameId) => Promise<void>;
  findPartyRecord: (partyId: string) => Promise<RaceGamePartyRecord | undefined>;
  updatePartyRecord: (
    updatedRecord: RaceGamePartyRecord
  ) => Promise<RaceGamePartyRecord | undefined>;
  findAggregatedGameRecordById(gameId: GameId): Promise<RaceGameAggregatedRecord>;
  updateCharacterRecord(combatant: Combatant): Promise<void>;
}

export class RaceGameRecordsService {
  constructor(
    private readonly raceGameRecordsPersistenceStrategy: RaceGameRecordsPersistenceStrategy
  ) {}

  async insertGameRecord(game: SpeedDungeonGame) {
    await this.raceGameRecordsPersistenceStrategy.insert(game);
  }

  async markGameCompleted(gameId: GameId) {
    await this.raceGameRecordsPersistenceStrategy.markGameCompleted(gameId);
  }

  async getExpectedPartyRecord(partyId: string) {
    const partyRecordOption =
      await this.raceGameRecordsPersistenceStrategy.findPartyRecord(partyId);
    if (partyRecordOption === undefined) {
      throw new Error(ERROR_MESSAGES.GAME_RECORDS.PARTY_RECORD_NOT_FOUND);
    }

    return partyRecordOption;
  }

  async applyUpdatedPartyRecord(updated: RaceGamePartyRecord) {
    return await this.raceGameRecordsPersistenceStrategy.updatePartyRecord(updated);
  }

  async findAggregatedGameRecordById(gameId: GameId) {
    return this.raceGameRecordsPersistenceStrategy.findAggregatedGameRecordById(gameId);
  }

  async updateCharacterRecord(combatant: Combatant) {
    return this.raceGameRecordsPersistenceStrategy.updateCharacterRecord(combatant);
  }
}
