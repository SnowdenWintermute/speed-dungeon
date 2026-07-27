import {
  EntityId,
  GameId,
  IdentityProviderId,
  LadderCharacterFloorClearRecordId,
  LadderPartyFloorClearRecordId,
  Username,
} from "../../aliases.js";
import {
  LADDER_MAX_PAGE_SIZE,
  LADDER_MAX_RANKED_ENTRIES,
  USER_GAME_HISTORY_PAGE_SIZE,
} from "../../app-consts.js";
import { invariant } from "../../utils/index.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { UsernameDirectory } from "../../servers/services/username-directory.js";
import {
  ExperiencePointsLadderService,
  experiencePointsLadderName,
} from "../../servers/services/experience-points-ladder-service.js";
import { UserGameDataPersistenceService } from "../../servers/services/user-game-data-persistence/index.js";
import { LadderGameRecordsService } from "../records/ladder-records-service.js";
import {
  FloorClearEntry,
  RankedFloorClearEntry,
  WinLossTally,
} from "../records/ladder-records-persistence-strategy.js";
import { winRateOf } from "../records/ladder-read-model-projections.js";
import { LadderPage, PagedLadderQuery, pageSizeOf } from "./ladder-page.js";
import {
  CumulativeClearTimesQuery,
  FloorClearTimesQuery,
  FloorClearView,
  RankedFloorClearView,
} from "./floor-clear-times.js";
import { GameRecordView } from "./game-record.js";
import { projectGameRecordView } from "./game-record-projection.js";
import { WinLossRecord, WinRateLadderQuery, WinRateLadderView } from "./win-rate-ladder.js";
import { CharacterFloorClearSnapshotView } from "./character-floor-clear-snapshot.js";
import { PlayerProfileLookup, PlayerProfileLookupType } from "./player-profile.js";
import { LadderQueries } from "./ladder-queries.js";
import {
  ExperiencePointsLadderQuery,
  ExperiencePointsLadderRankQuery,
  ExperiencePointsLadderViewEntry,
} from "./experience-points-ladder.js";
import { projectExperiencePointsLadderPage } from "./experience-points-ladder-projection.js";
import { UserGameHistoryEntry, UserGameHistoryQuery } from "./user-game-history.js";
import { ProgressionCharacterView } from "./progression-character.js";
import { projectProgressionCharacterView } from "./progression-character-projection.js";

// executes the queries in-process against the ladder stores. the server runs it over its own
// persistence strategy on behalf of a connected client; offline clients run it over their local one.
export class LocalLadderQueries implements LadderQueries {
  constructor(
    private readonly ladderGameRecordsService: LadderGameRecordsService,
    private readonly usernameDirectory: UsernameDirectory,
    private readonly experiencePointsLadderService: ExperiencePointsLadderService,
    private readonly userGameDataPersistenceService: UserGameDataPersistenceService
  ) {}

  // the two stores this joins answer different questions: the sorted set ranks, the saved characters
  // describe. neither is a copy of the other, so neither can go stale against the other
  async getExperiencePointsLadderPage(
    query: ExperiencePointsLadderQuery
  ): Promise<LadderPage<ExperiencePointsLadderViewEntry>> {
    validatePagedQuery(query);
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

    return projectExperiencePointsLadderPage(
      rankings,
      query.page,
      pageSize,
      charactersById,
      usernamesByOwnerId
    );
  }

  async getFloorClearTimes(query: FloorClearTimesQuery): Promise<LadderPage<RankedFloorClearView>> {
    validatePagedQuery(query);
    const page = await this.ladderGameRecordsService.getFloorClearTimes(query);
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
    validatePagedQuery(query);
    const page = await this.ladderGameRecordsService.getCumulativeClearTimes(query);
    const usernameOf = await this.resolverForPlayers(
      page.entries.flatMap((entry) => entry.players)
    );

    return {
      ...page,
      entries: page.entries.map((entry) => toRankedFloorClearView(entry, usernameOf)),
    };
  }

  // the sorted set already knows where a member sits, so this is a read of one position rather than
  // of a page. zRevRank counts from zero and every rank the client is shown counts from one
  async getExperiencePointsLadderRanks(
    query: ExperiencePointsLadderRankQuery
  ): Promise<Record<EntityId, number>> {
    const ladderName = experiencePointsLadderName(query.controlScheme);
    const ranksById: Record<EntityId, number> = {};

    for (const characterId of new Set(query.characterIds)) {
      const rankOption = await this.experiencePointsLadderService.getCurrentRank(
        ladderName,
        characterId
      );
      if (rankOption !== null) {
        ranksById[characterId] = rankOption + 1;
      }
    }

    return ranksById;
  }

  async getCumulativeClearRanks(
    ids: LadderPartyFloorClearRecordId[]
  ): Promise<Record<LadderPartyFloorClearRecordId, number>> {
    return this.ladderGameRecordsService.getCumulativeClearRanks(ids);
  }

  async getFloorClear(id: LadderPartyFloorClearRecordId): Promise<FloorClearView | undefined> {
    const entryOption = await this.ladderGameRecordsService.getFloorClearById(id);
    if (entryOption === undefined) {
      return undefined;
    }
    const usernameOf = await this.resolverForPlayers(entryOption.players);
    return toFloorClearView(entryOption, usernameOf);
  }

  async getGameRecord(id: GameId): Promise<GameRecordView | undefined> {
    const aggregateOption = await this.ladderGameRecordsService.getGameRecordAggregate(id);
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
    return projectGameRecordView(aggregateOption, usernameOf);
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

    return projectProgressionCharacterView(characterOption, ownerUsernameOption);
  }

  async getWinRateLadder(query: WinRateLadderQuery): Promise<LadderPage<WinRateLadderView>> {
    validatePagedQuery(query);
    const page = await this.ladderGameRecordsService.getWinRateLadder(query);
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
    return this.ladderGameRecordsService.getCharacterFloorClearSnapshot(id);
  }

  async getPlayerProfile(username: Username): Promise<PlayerProfileLookup> {
    const userIdOption = await this.usernameDirectory.findUserIdByUsername(username);
    if (userIdOption === undefined) {
      return { type: PlayerProfileLookupType.NoSuchPlayer };
    }

    // only players with ladder history get a participant record, so a real user with none is found
    // with an empty profile
    const dataOption = await this.ladderGameRecordsService.getPlayerProfileData(userIdOption);
    if (dataOption === undefined) {
      return {
        type: PlayerProfileLookupType.Found,
        profile: {
          username,
          rankedRaceRecord: toWinLossRecord({ wins: 0, losses: 0, gamesPlayed: 0 }),
          personalBestFloorClears: [],
        },
      };
    }

    const usernameOf = await this.resolverForPlayers(
      dataOption.personalBestFloorClears.flatMap((entry) => entry.players)
    );

    return {
      type: PlayerProfileLookupType.Found,
      profile: {
        username,
        rankedRaceRecord: toWinLossRecord(dataOption.rankedRaceTally),
        personalBestFloorClears: dataOption.personalBestFloorClears.map((entry) =>
          toFloorClearView(entry, usernameOf)
        ),
      },
    };
  }

  // an unknown username yields an empty page rather than its own "no such player" case: the profile
  // query rendered alongside this one is what distinguishes a missing player from an idle one
  async getUserGameHistory(query: UserGameHistoryQuery): Promise<LadderPage<UserGameHistoryEntry>> {
    validatePagedQuery(query);
    const userIdOption = await this.usernameDirectory.findUserIdByUsername(query.username);
    if (userIdOption === undefined) {
      return { page: query.page, totalPages: 0, entries: [] };
    }

    const entries = await this.ladderGameRecordsService.getUserGameHistory(
      userIdOption,
      query.page,
      query.dateRangeOption
    );
    const totalRecordsCount = await this.ladderGameRecordsService.getUserGameRecordsCount(
      userIdOption,
      query.dateRangeOption
    );

    return {
      page: query.page,
      totalPages: Math.ceil(totalRecordsCount / USER_GAME_HISTORY_PAGE_SIZE),
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
        await this.ladderGameRecordsService.findParticipantRecordById(id);
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

// the query reaches here from a client we do not control. a negative page is not merely empty: it
// reaches zRange as an index counted from the end of the sorted set, and SQL OFFSET as an error. a
// page size is worse than either — it is the caller naming how many rows the server will read — so
// it is capped rather than merely well-formed
function validatePagedQuery(query: PagedLadderQuery): void {
  if (!Number.isInteger(query.page) || query.page < 0) {
    throw new Error(ERROR_MESSAGES.LADDER.INVALID_PAGE);
  }
  const { pageSizeOption } = query;
  if (
    pageSizeOption !== undefined &&
    (!Number.isInteger(pageSizeOption) ||
      pageSizeOption < 1 ||
      pageSizeOption > LADDER_MAX_PAGE_SIZE)
  ) {
    throw new Error(ERROR_MESSAGES.LADDER.INVALID_PAGE_SIZE(LADDER_MAX_PAGE_SIZE));
  }
  // depth is refused rather than answered emptily, because the cost of OFFSET is paid on the way to
  // discovering there is nothing there. no pager can lead a reader this deep — totalPages is capped
  // to match — so a request this deep was hand-written
  if (query.page * pageSizeOf(query) >= LADDER_MAX_RANKED_ENTRIES) {
    throw new Error(ERROR_MESSAGES.LADDER.PAGE_BEYOND_RANKED_ENTRIES(LADDER_MAX_RANKED_ENTRIES));
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
