import { GameId } from "../../aliases.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { PartyFate } from "../../types.js";

export interface RaceGamePartyRecord {
  id: number;
  gameRecordId: number;
  partyName: string;
  partyFate: PartyFate;
  partyFateRecordedAt: null | string;
  isWinner: boolean;
  deepestFloor: number;
}

export interface RaceGameRecordsPersistenceStrategy {
  insert: (game: SpeedDungeonGame) => Promise<void>;
  markGameCompleted: (gameId: GameId) => Promise<void>;
  findPartyRecord: (partyId: string) => Promise<RaceGamePartyRecord | undefined>;
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
}
