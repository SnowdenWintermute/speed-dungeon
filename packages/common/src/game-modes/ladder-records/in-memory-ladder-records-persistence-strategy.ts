import cloneDeep from "lodash.clonedeep";
import { USER_GAME_HISTORY_PAGE_SIZE } from "../../app-consts.js";
import {
  CombatantId,
  GameId,
  IdentityProviderId,
  LadderCharacterFloorClearedRecordId,
  LadderPartyFloorClearedRecordId,
  PartyId,
} from "../../aliases.js";
import { DateRange } from "../../primatives/date-range.js";
import { invariant } from "../../utils/index.js";
import {
  LadderCharacterFloorClearedRecord,
  LadderCharacterRecord,
  LadderGameRecord,
  LadderParticipantRecord,
  LadderPartyFloorClearRecord,
  LadderPartyRecord,
  PartyFate,
} from "./index.js";
import {
  LadderGameRecordAggregate,
  LadderPartyFateUpdate,
  LadderPartyFloorClearWrite,
  LadderRecordsPersistenceStrategy,
  NewLadderGameRecordSet,
  UserGameHistoryEntry,
} from "./ladder-records-persistence-strategy.js";

export class InMemoryLadderRecordsPersistenceStrategy implements LadderRecordsPersistenceStrategy {
  private games = new Map<GameId, LadderGameRecord>();
  private participants = new Map<IdentityProviderId, LadderParticipantRecord>();
  private gameParticipantLinks: {
    gameRecordId: GameId;
    participantRecordId: IdentityProviderId;
  }[] = [];
  private parties = new Map<PartyId, LadderPartyRecord>();
  private characters = new Map<CombatantId, LadderCharacterRecord>();
  private partyFloorClears = new Map<
    LadderPartyFloorClearedRecordId,
    LadderPartyFloorClearRecord
  >();
  private characterFloorClearedSnapshots = new Map<
    LadderCharacterFloorClearedRecordId,
    LadderCharacterFloorClearedRecord
  >();

  async getUserGameHistory(
    userId: IdentityProviderId,
    page: number,
    dateRange?: DateRange
  ): Promise<UserGameHistoryEntry[]> {
    const games = this.gamesForUser(userId, dateRange).sort(
      (a, b) => b.timeStarted - a.timeStarted
    );
    const pageStart = page * USER_GAME_HISTORY_PAGE_SIZE;
    const pageOfGames = games.slice(pageStart, pageStart + USER_GAME_HISTORY_PAGE_SIZE);
    return pageOfGames.map((game) => ({
      gameId: game.id,
      gameName: game.name,
      date: game.timeStarted,
      fateOptionOfQueryingPlayerParty: this.queryingPlayerPartyFate(game.id, userId),
    }));
  }

  async getUserGameRecordsCount(
    userId: IdentityProviderId,
    dateRange?: DateRange
  ): Promise<number> {
    return this.gamesForUser(userId, dateRange).length;
  }

  private gamesForUser(userId: IdentityProviderId, dateRange?: DateRange): LadderGameRecord[] {
    const gameIds = new Set(
      this.gameParticipantLinks
        .filter((link) => link.participantRecordId === userId)
        .map((link) => link.gameRecordId)
    );
    const games: LadderGameRecord[] = [];
    for (const gameId of gameIds) {
      const game = this.games.get(gameId);
      invariant(game !== undefined, "expected a game record for a participant link's gameId");
      if (dateRange !== undefined) {
        const inRange = game.timeStarted >= dateRange.start && game.timeStarted <= dateRange.end;
        if (!inRange) {
          continue;
        }
      }
      games.push(game);
    }
    return games;
  }

  private queryingPlayerPartyFate(
    gameId: GameId,
    userId: IdentityProviderId
  ): PartyFate | undefined {
    for (const character of this.characters.values()) {
      if (character.controllingPlayerId !== userId) {
        continue;
      }
      const party = this.parties.get(character.partyRecordId);
      if (party !== undefined && party.gameRecordId === gameId) {
        return party.fateOption;
      }
    }
    return undefined;
  }

  async findParticipantRecordById(
    id: IdentityProviderId
  ): Promise<LadderParticipantRecord | undefined> {
    const participant = this.participants.get(id);
    return participant === undefined ? undefined : cloneDeep(participant);
  }

  async upsertParticipantRecord(record: LadderParticipantRecord): Promise<void> {
    // global per user, like ON CONFLICT (id) DO NOTHING
    if (!this.participants.has(record.id)) {
      this.participants.set(record.id, cloneDeep(record));
    }
  }

  async insertNewGameRecordSet(set: NewLadderGameRecordSet): Promise<void> {
    const cloned = cloneDeep(set);
    this.games.set(cloned.game.id, cloned.game);
    for (const participantRecord of cloned.participantRecords) {
      this.gameParticipantLinks.push({
        gameRecordId: cloned.game.id,
        participantRecordId: participantRecord.id,
      });
    }
    for (const party of cloned.parties) {
      this.parties.set(party.id, party);
    }
    for (const character of cloned.characters) {
      this.characters.set(character.id, character);
    }
  }

  async recordPartyFloorClear(write: LadderPartyFloorClearWrite): Promise<void> {
    const cloned = cloneDeep(write);
    this.partyFloorClears.set(cloned.partyFloorClear.id, cloned.partyFloorClear);
    for (const snapshot of cloned.characterSnapshots) {
      this.characterFloorClearedSnapshots.set(snapshot.id, snapshot);
    }
    const party = this.parties.get(cloned.partyRecordId);
    if (party) {
      party.deepestFloorReached = cloned.deepestFloorReached;
    }
    for (const levelUpdate of cloned.characterLevelUpdates) {
      const character = this.characters.get(levelUpdate.characterRecordId);
      if (character !== undefined) {
        character.mainClass.level = levelUpdate.mainClassLevel;
        if (
          levelUpdate.supportClassLevel !== undefined &&
          character.supportClassOption !== undefined
        ) {
          character.supportClassOption.level = levelUpdate.supportClassLevel;
        }
      }
    }
  }

  async updatePartyFate(update: LadderPartyFateUpdate): Promise<void> {
    const party = this.parties.get(update.partyRecordId);
    if (party) {
      party.fateOption = cloneDeep(update.fate);
      party.deepestFloorReached = update.deepestFloorReached;
    }
  }

  async findGameRecordAggregateById(id: GameId): Promise<LadderGameRecordAggregate | undefined> {
    const game = this.games.get(id);
    if (game === undefined) {
      return undefined;
    }

    const participantIds = new Set(
      this.gameParticipantLinks
        .filter((link) => link.gameRecordId === id)
        .map((link) => link.participantRecordId)
    );
    const participants = [...this.participants.values()].filter((participant) =>
      participantIds.has(participant.id)
    );

    const parties = [...this.parties.values()]
      .filter((party) => party.gameRecordId === id)
      .map((party) => ({
        party,
        floorClears: [...this.partyFloorClears.values()].filter(
          (floorClear) => floorClear.partyRecordRef === party.id
        ),
        characters: [...this.characters.values()]
          .filter((character) => character.partyRecordId === party.id)
          .map((character) => ({
            character,
            floorClearedSnapshots: [...this.characterFloorClearedSnapshots.values()].filter(
              (snapshot) => snapshot.characterRecordRef === character.id
            ),
          })),
      }));

    return cloneDeep({ game, participants, parties });
  }
}
