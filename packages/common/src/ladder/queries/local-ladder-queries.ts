import { IdentityProviderId, LadderCharacterFloorClearRecordId, Username } from "../../aliases.js";
import { invariant } from "../../utils/index.js";
import { UsernameDirectory } from "../../servers/services/username-directory.js";
import { LadderGameRecordsService } from "../records/ladder-records-service.js";
import { FloorClearEntry, WinLossTally } from "../records/ladder-records-persistence-strategy.js";
import { winRateOf } from "../records/ladder-read-model-projections.js";
import { LadderPage } from "./ladder-page.js";
import { FloorClearTimesQuery, FloorClearView } from "./floor-clear-times.js";
import { WinLossRecord, WinRateLadderQuery, WinRateLadderView } from "./win-rate-ladder.js";
import { CharacterFloorClearSnapshotView } from "./character-floor-clear-snapshot.js";
import { PlayerProfileLookup, PlayerProfileLookupType } from "./player-profile.js";
import { LadderQueries } from "./ladder-queries.js";

// executes the queries in-process against ladder records. the server runs it over its own
// persistence strategy on behalf of a connected client; offline clients run it over their local one.
export class LocalLadderQueries implements LadderQueries {
  constructor(
    private readonly ladderGameRecordsService: LadderGameRecordsService,
    private readonly usernameDirectory: UsernameDirectory
  ) {}

  async getFloorClearTimes(query: FloorClearTimesQuery): Promise<LadderPage<FloorClearView>> {
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

function toFloorClearView(
  entry: FloorClearEntry,
  usernameOf: (id: IdentityProviderId) => Username
): FloorClearView {
  return { ...entry, players: entry.players.map(usernameOf) };
}

function toWinLossRecord(tally: WinLossTally): WinLossRecord {
  return { ...tally, winRate: winRateOf(tally) };
}
