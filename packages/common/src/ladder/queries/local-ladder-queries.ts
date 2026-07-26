import { IdentityProviderId, LadderCharacterFloorClearRecordId, Username } from "../../aliases.js";
import { LADDER_CONFIG, USER_GAME_HISTORY_PAGE_SIZE } from "../../app-consts.js";
import { invariant } from "../../utils/index.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { UsernameDirectory } from "../../servers/services/username-directory.js";
import {
  ExperiencePointsLadderService,
  experiencePointsLadderName,
} from "../../servers/services/experience-points-ladder-service.js";
import { UserGameDataPersistenceService } from "../../servers/services/user-game-data-persistence/index.js";
import { LadderGameRecordsService } from "../records/ladder-records-service.js";
import { FloorClearEntry, WinLossTally } from "../records/ladder-records-persistence-strategy.js";
import { winRateOf } from "../records/ladder-read-model-projections.js";
import { LadderPage } from "./ladder-page.js";
import { FloorClearTimesQuery, FloorClearView } from "./floor-clear-times.js";
import { WinLossRecord, WinRateLadderQuery, WinRateLadderView } from "./win-rate-ladder.js";
import { CharacterFloorClearSnapshotView } from "./character-floor-clear-snapshot.js";
import { PlayerProfileLookup, PlayerProfileLookupType } from "./player-profile.js";
import { LadderQueries } from "./ladder-queries.js";
import {
  ExperiencePointsLadderQuery,
  ExperiencePointsLadderViewEntry,
} from "./experience-points-ladder.js";
import { projectExperiencePointsLadderPage } from "./experience-points-ladder-projection.js";
import { UserGameHistoryEntry, UserGameHistoryQuery } from "./user-game-history.js";

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
    validatePage(query.page);
    const rankings = await this.experiencePointsLadderService.getRankedPage(
      experiencePointsLadderName(query.controlScheme),
      query.page,
      LADDER_CONFIG.PAGE_SIZE
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
      charactersById,
      usernamesByOwnerId
    );
  }

  async getFloorClearTimes(query: FloorClearTimesQuery): Promise<LadderPage<FloorClearView>> {
    validatePage(query.page);
    const page = await this.ladderGameRecordsService.getFloorClearTimes(query);
    const usernameOf = await this.resolverForPlayers(
      page.entries.flatMap((entry) => entry.players)
    );

    return {
      ...page,
      entries: page.entries.map((entry) => toFloorClearView(entry, usernameOf)),
    };
  }

  async getWinRateLadder(query: WinRateLadderQuery): Promise<LadderPage<WinRateLadderView>> {
    validatePage(query.page);
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
    validatePage(query.page);
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
// reaches zRange as an index counted from the end of the sorted set, and SQL OFFSET as an error
function validatePage(page: number): void {
  if (!Number.isInteger(page) || page < 0) {
    throw new Error(ERROR_MESSAGES.LADDER.INVALID_PAGE);
  }
}

function toFloorClearView(
  entry: FloorClearEntry,
  usernameOf: (id: IdentityProviderId) => Username
): FloorClearView {
  return { ...entry, players: entry.players.map(usernameOf) };
}

function toWinLossRecord(tally: WinLossTally): WinLossRecord {
  return { ...tally, winRate: winRateOf(tally) };
}
