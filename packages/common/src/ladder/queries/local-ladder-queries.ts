import {
  EntityId,
  GameId,
  IdentityProviderId,
  LadderCharacterFloorClearRecordId,
  LadderPartyFloorClearRecordId,
  Username,
} from "../../aliases.js";
import { USER_GAME_HISTORY_PAGE_SIZE } from "../../app-consts.js";
import { CharacterControlScheme } from "../../game-modes/index.js";
import { invariant } from "../../utils/index.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { UsernameDirectory } from "../../servers/services/username-directory.js";
import {
  ExperiencePointsLadderService,
  experiencePointsLadderName,
} from "../../servers/services/experience-points-ladder-service.js";
import { UserGameDataPersistenceService } from "../../servers/services/user-game-data-persistence/index.js";
import {
  FloorClearEntry,
  LadderRecordsPersistenceStrategy,
  RankedFloorClearEntry,
  WinLossTally,
} from "../records/ladder-records-persistence-strategy.js";
import { winRateOf } from "../records/ladder-read-model-assembly.js";
import { LadderPage, pageSizeOf, totalPagesOf } from "./ladder-page.js";
import {
  validateCumulativeClearTimesQuery,
  validateExperiencePointsLadderQuery,
  validateExperiencePointsLadderRankQuery,
  validateFloorClearTimesQuery,
  validatePlayerProgressionCharactersQuery,
  validateRankLookupIds,
  validateUserGameHistoryQuery,
  validateWinRateLadderQuery,
} from "./validate-ladder-queries.js";
import {
  CumulativeClearTimesQuery,
  FloorClearTimesQuery,
  FloorClearView,
  RankedFloorClearView,
} from "./floor-clear-times.js";
import { GameRecordView } from "./game-record.js";
import { assembleGameRecordView } from "./game-record-assembly.js";
import { WinLossRecord, WinRateLadderQuery, WinRateLadderView } from "./win-rate-ladder.js";
import { CharacterFloorClearSnapshotView } from "./character-floor-clear-snapshot.js";
import { PlayerProfileLookup, PlayerProfileLookupType } from "./player-profile.js";
import { LadderQueries } from "./ladder-queries.js";
import {
  ExperiencePointsLadderQuery,
  ExperiencePointsLadderRankQuery,
  ExperiencePointsLadderViewEntry,
  PlayerProgressionCharactersQuery,
  PlayerProgressionCharactersView,
} from "./experience-points-ladder.js";
import { assembleExperiencePointsLadderPage } from "./experience-points-ladder-assembly.js";
import {
  byMostExperienced,
  assembleProgressionCharacterSummary,
} from "./progression-character-summary-assembly.js";
import { UserGameHistoryEntry, UserGameHistoryQuery } from "./user-game-history.js";
import { ProgressionCharacterView } from "./progression-character.js";
import { assembleProgressionCharacterView } from "./progression-character-assembly.js";

// executes the queries in-process against the ladder stores. the server runs it over its own
// persistence strategy on behalf of a connected client; offline clients run it over their local one.
export class LocalLadderQueries implements LadderQueries {
  constructor(
    private readonly ladderRecordsPersistenceStrategy: LadderRecordsPersistenceStrategy,
    private readonly usernameDirectory: UsernameDirectory,
    private readonly experiencePointsLadderService: ExperiencePointsLadderService,
    private readonly userGameDataPersistenceService: UserGameDataPersistenceService
  ) {}

  // the two stores this joins answer different questions: the sorted set ranks, the saved characters
  // describe. neither is a copy of the other, so neither can go stale against the other
  async getExperiencePointsLadderPage(
    query: ExperiencePointsLadderQuery
  ): Promise<LadderPage<ExperiencePointsLadderViewEntry>> {
    validateExperiencePointsLadderQuery(query);
    const pageSize = pageSizeOf(query);
    const rankings = await this.experiencePointsLadderService.getRankedPage(
      experiencePointsLadderName(query.controlScheme),
      query.page,
      pageSize
    );

    const characters = await this.userGameDataPersistenceService.findSavedCharactersByIds(
      rankings.entryIds
    );
    const charactersById = new Map(characters.map((character) => [character.id, character]));
    const usernamesByOwnerId = await this.usernameDirectory.resolveUsernames([
      ...new Set(characters.map((character) => character.ownerId)),
    ]);

    return assembleExperiencePointsLadderPage(
      rankings,
      query.page,
      pageSize,
      charactersById,
      usernamesByOwnerId
    );
  }

  async getFloorClearTimes(query: FloorClearTimesQuery): Promise<LadderPage<RankedFloorClearView>> {
    validateFloorClearTimesQuery(query);
    const page = await this.ladderRecordsPersistenceStrategy.getFloorClearTimes(query);
    const usernameOf = await this.resolverForPlayers(
      page.entries.flatMap((entry) => entry.players)
    );

    return {
      ...page,
      entries: page.entries.map((entry) => toRankedFloorClearView(entry, usernameOf)),
    };
  }

  async getCumulativeClearTimes(
    query: CumulativeClearTimesQuery
  ): Promise<LadderPage<RankedFloorClearView>> {
    validateCumulativeClearTimesQuery(query);
    const page = await this.ladderRecordsPersistenceStrategy.getCumulativeClearTimes(query);
    const usernameOf = await this.resolverForPlayers(
      page.entries.flatMap((entry) => entry.players)
    );

    return {
      ...page,
      entries: page.entries.map((entry) => toRankedFloorClearView(entry, usernameOf)),
    };
  }

  // the sorted set already knows where a member sits, so this is a read of one position rather than
  // of a page
  async getExperiencePointsLadderRanks(
    query: ExperiencePointsLadderRankQuery
  ): Promise<Record<EntityId, number>> {
    validateExperiencePointsLadderRankQuery(query);
    return this.readRanks(query.controlScheme, query.characterIds);
  }

  private async readRanks(
    controlScheme: CharacterControlScheme,
    characterIds: EntityId[]
  ): Promise<Record<EntityId, number>> {
    const ladderName = experiencePointsLadderName(controlScheme);
    const ranksById: Record<EntityId, number> = {};

    for (const characterId of new Set(characterIds)) {
      const rankOption = await this.experiencePointsLadderService.getCurrentRank(
        ladderName,
        characterId
      );
      if (rankOption !== null) {
        ranksById[characterId] = rankOption;
      }
    }

    return ranksById;
  }

  async getCumulativeClearRanks(
    ids: LadderPartyFloorClearRecordId[]
  ): Promise<Record<LadderPartyFloorClearRecordId, number>> {
    validateRankLookupIds(ids);
    return this.ladderRecordsPersistenceStrategy.getCumulativeClearRanks(ids);
  }

  async getFloorClear(id: LadderPartyFloorClearRecordId): Promise<FloorClearView | undefined> {
    const entryOption = await this.ladderRecordsPersistenceStrategy.findFloorClearById(id);
    if (entryOption === undefined) {
      return undefined;
    }
    const usernameOf = await this.resolverForPlayers(entryOption.players);
    return toFloorClearView(entryOption, usernameOf);
  }

  async getGameRecord(id: GameId): Promise<GameRecordView | undefined> {
    const aggregateOption =
      await this.ladderRecordsPersistenceStrategy.findGameRecordAggregateById(id);
    if (aggregateOption === undefined) {
      return undefined;
    }
    // character owners are resolved alongside the participants rather than assumed to be among them:
    // a character can change hands when a player abandons, so the two lists are related but not one
    const usernameOf = await this.resolverForPlayers([
      ...aggregateOption.participations.map((participation) => participation.participantRecordId),
      ...aggregateOption.parties.flatMap((party) =>
        party.characters.map(({ character }) => character.controllingPlayerId)
      ),
    ]);
    return assembleGameRecordView(aggregateOption, usernameOf);
  }

  // the same saved character an experience points ladder row is hydrated from, read whole this time.
  // findByIds rather than fetchCharacter because a page reached by url can name a character that no
  // longer exists, which is an empty page and not an error
  async getProgressionCharacter(id: EntityId): Promise<ProgressionCharacterView | undefined> {
    const [characterOption] = await this.userGameDataPersistenceService.findSavedCharactersByIds([
      id,
    ]);
    if (characterOption === undefined) {
      return undefined;
    }

    const usernamesByOwnerId = await this.usernameDirectory.resolveUsernames([
      characterOption.ownerId,
    ]);
    // a character whose owner was deleted upstream reads as gone rather than as a nameless build, the
    // same way the ladder page skips the row that would link here. the log line is how we learn it
    // is happening: the ladder participant fallback cannot help, since owning a character never made
    // anyone a ladder participant
    const ownerUsernameOption = usernamesByOwnerId.get(characterOption.ownerId);
    if (ownerUsernameOption === undefined) {
      console.info(
        `saved character ${id} has no resolvable owner (${characterOption.ownerId}), reporting it as missing`
      );
      return undefined;
    }

    return assembleProgressionCharacterView(characterOption, ownerUsernameOption);
  }

  // an unknown username is an empty list rather than its own "no such player" case, as the game
  // history is: the profile query rendered beside this one is what tells a reader they do not exist
  async getPlayerProgressionCharacters(
    query: PlayerProgressionCharactersQuery
  ): Promise<PlayerProgressionCharactersView> {
    validatePlayerProgressionCharactersQuery(query);
    const userIdOption = await this.usernameDirectory.findUserIdByUsername(query.username);
    if (userIdOption === undefined) {
      return { characters: [], ranksByCharacterId: {} };
    }

    const savedCharacters = await this.userGameDataPersistenceService.findSavedCharactersByOwner(
      userIdOption,
      query.controlScheme
    );
    const characters = savedCharacters
      .map((character) => assembleProgressionCharacterSummary(character, query.username))
      .sort(byMostExperienced);

    // the ranks travel back with the characters rather than as a second query. a board asks for none
    // of this — a row's rank there is its position on the page being read — so the rank lookup is
    // for characters ranked somewhere other than the page in front of you, which is what a profile
    // lists. the ids are the ones just read and they can only be on this one ladder, so asking over
    // the wire would be a round trip that cannot even start until this one lands.
    // they stay off the rows: a rank is the ladder's answer about a character rather than something
    // the character has, and one that has left the ladder is simply absent
    return {
      characters,
      ranksByCharacterId: await this.readRanks(
        query.controlScheme,
        characters.map((character) => character.characterId)
      ),
    };
  }

  async getWinRateLadder(query: WinRateLadderQuery): Promise<LadderPage<WinRateLadderView>> {
    validateWinRateLadderQuery(query);
    const page = await this.ladderRecordsPersistenceStrategy.getWinRateLadder(query);
    const usernameOf = await this.resolverForPlayers(
      page.entries.map((entry) => entry.participantId)
    );

    return {
      ...page,
      entries: page.entries.map((entry) => ({
        rank: entry.rank,
        username: usernameOf(entry.participantId),
        record: toWinLossRecord(entry.tally),
      })),
    };
  }

  async getCharacterFloorClearSnapshot(
    id: LadderCharacterFloorClearRecordId
  ): Promise<CharacterFloorClearSnapshotView | undefined> {
    return this.ladderRecordsPersistenceStrategy.getCharacterFloorClearSnapshot(id);
  }

  async getPlayerProfile(username: Username): Promise<PlayerProfileLookup> {
    const userIdOption = await this.usernameDirectory.findUserIdByUsername(username);
    if (userIdOption === undefined) {
      return { type: PlayerProfileLookupType.NoSuchPlayer };
    }

    // only players with ladder history get a participant record, so a real user with none is found
    // with an empty profile
    const dataOption =
      await this.ladderRecordsPersistenceStrategy.getPlayerProfileData(userIdOption);
    if (dataOption === undefined) {
      return {
        type: PlayerProfileLookupType.Found,
        profile: {
          username,
          rankedRaceRecord: toWinLossRecord({ wins: 0, losses: 0, gamesPlayed: 0 }),
          personalBestFloorTimes: [],
          personalBestCumulativeTimes: [],
        },
      };
    }

    // one resolution for both lists: they overlap heavily — often the same clear appears in each —
    // and resolving twice would ask the directory about the same players again
    const usernameOf = await this.resolverForPlayers(
      [...dataOption.personalBestFloorTimes, ...dataOption.personalBestCumulativeTimes].flatMap(
        (entry) => entry.players
      )
    );

    return {
      type: PlayerProfileLookupType.Found,
      profile: {
        username,
        rankedRaceRecord: toWinLossRecord(dataOption.rankedRaceTally),
        personalBestFloorTimes: dataOption.personalBestFloorTimes.map((entry) =>
          toFloorClearView(entry, usernameOf)
        ),
        personalBestCumulativeTimes: dataOption.personalBestCumulativeTimes.map((entry) =>
          toFloorClearView(entry, usernameOf)
        ),
      },
    };
  }

  // an unknown username yields an empty page rather than its own "no such player" case: the profile
  // query rendered alongside this one is what distinguishes a missing player from an idle one
  async getUserGameHistory(query: UserGameHistoryQuery): Promise<LadderPage<UserGameHistoryEntry>> {
    validateUserGameHistoryQuery(query);
    const userIdOption = await this.usernameDirectory.findUserIdByUsername(query.username);
    if (userIdOption === undefined) {
      return { page: query.page, totalPages: 0, entries: [] };
    }

    const entries = await this.ladderRecordsPersistenceStrategy.getUserGameHistory(
      userIdOption,
      query.page,
      query.dateRangeOption
    );
    const totalRecordsCount = await this.ladderRecordsPersistenceStrategy.getUserGameRecordsCount(
      userIdOption,
      query.dateRangeOption
    );

    return {
      page: query.page,
      totalPages: totalPagesOf(totalRecordsCount, USER_GAME_HISTORY_PAGE_SIZE),
      entries,
    };
  }

  // a participant id always has a name: the identity provider's current one, or — once the account is
  // deleted there — the last one we saw them connect under
  private async resolverForPlayers(ids: IdentityProviderId[]) {
    const uniqueIds = [...new Set(ids)];
    const usernamesById = await this.usernameDirectory.resolveUsernames(uniqueIds);

    for (const id of uniqueIds) {
      if (usernamesById.has(id)) {
        continue;
      }
      const participantRecordOption =
        await this.ladderRecordsPersistenceStrategy.findParticipantRecordById(id);
      const lastKnownUsernameOption = participantRecordOption?.lastKnownUsername;
      invariant(lastKnownUsernameOption !== undefined, `no username for ladder participant ${id}`);
      usernamesById.set(id, lastKnownUsernameOption);
    }

    return (id: IdentityProviderId): Username => {
      const usernameOption = usernamesById.get(id);
      invariant(usernameOption !== undefined, `unresolved ladder participant ${id}`);
      return usernameOption;
    };
  }
}

function toFloorClearView(
  entry: FloorClearEntry,
  usernameOf: (id: IdentityProviderId) => Username
): FloorClearView {
  return {
    ...entry,
    players: entry.players.map(usernameOf),
    characters: entry.characters.map((character) => ({
      ...character,
      owner: usernameOf(character.owner),
    })),
  };
}

function toRankedFloorClearView(
  entry: RankedFloorClearEntry,
  usernameOf: (id: IdentityProviderId) => Username
): RankedFloorClearView {
  return { ...toFloorClearView(entry, usernameOf), rank: entry.rank };
}

function toWinLossRecord(tally: WinLossTally): WinLossRecord {
  return { ...tally, winRate: winRateOf(tally) };
}
