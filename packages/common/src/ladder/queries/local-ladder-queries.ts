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
import { PlayerProfileView } from "./player-profile.js";
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

  async getPlayerProfile(username: Username): Promise<PlayerProfileView | undefined> {
    const userIdOption = await this.usernameDirectory.findUserIdByUsername(username);
    if (userIdOption === undefined) {
      return undefined;
    }

    const dataOption = await this.ladderGameRecordsService.getPlayerProfileData(userIdOption);
    if (dataOption === undefined) {
      return undefined;
    }

    const usernameOf = await this.resolverForPlayers(
      dataOption.personalBestFloorClears.flatMap((entry) => entry.players)
    );

    return {
      username,
      rankedRaceRecord: toWinLossRecord(dataOption.rankedRaceTally),
      personalBestFloorClears: dataOption.personalBestFloorClears.map((entry) =>
        toFloorClearView(entry, usernameOf)
      ),
    };
  }

  // a participant id always has a name: the identity provider's current one, or the one the
  // participant record captured when the account was deleted there
  private async resolverForPlayers(ids: IdentityProviderId[]) {
    const uniqueIds = [...new Set(ids)];
    const usernamesById = await this.usernameDirectory.resolveUsernames(uniqueIds);

    for (const id of uniqueIds) {
      if (usernamesById.has(id)) {
        continue;
      }
      const participantRecordOption =
        await this.ladderGameRecordsService.findParticipantRecordById(id);
      const usernameAtDeletionOption = participantRecordOption?.usernameAtTimeOfAccountDeletion;
      invariant(usernameAtDeletionOption !== undefined, `no username for ladder participant ${id}`);
      usernamesById.set(id, usernameAtDeletionOption);
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
