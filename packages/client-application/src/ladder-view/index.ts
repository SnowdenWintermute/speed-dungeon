import {
  CharacterFloorClearSnapshotView,
  CumulativeClearTimesQuery,
  ExperiencePointsLadderQuery,
  ExperiencePointsLadderViewEntry,
  FloorClearTimesQuery,
  FloorClearView,
  GameId,
  GameRecordView,
  LadderCharacterFloorClearRecordId,
  LadderPage,
  LadderPartyFloorClearRecordId,
  PlayerProfileLookup,
  RankedFloorClearView,
  ReactiveNode,
  UserGameHistoryEntry,
  UserGameHistoryQuery,
  Username,
  WinRateLadderQuery,
  WinRateLadderView,
} from "@speed-dungeon/common";
import { ClientApplication } from "..";
import { KeyedQueryCache } from "./keyed-query-cache";

// the read side of the ladder as observable state: the route decides which query it is looking at,
// this holds the answers. nothing here owns a "current selection" — the url does
export class LadderViewStore implements ReactiveNode {
  readonly experiencePointsLadder: KeyedQueryCache<
    ExperiencePointsLadderQuery,
    LadderPage<ExperiencePointsLadderViewEntry>
  >;
  readonly floorClearTimes: KeyedQueryCache<
    FloorClearTimesQuery,
    LadderPage<RankedFloorClearView>
  >;
  readonly cumulativeClearTimes: KeyedQueryCache<
    CumulativeClearTimesQuery,
    LadderPage<RankedFloorClearView>
  >;
  readonly floorClear: KeyedQueryCache<
    LadderPartyFloorClearRecordId,
    FloorClearView | undefined
  >;
  readonly gameRecord: KeyedQueryCache<GameId, GameRecordView | undefined>;
  readonly winRateLadder: KeyedQueryCache<WinRateLadderQuery, LadderPage<WinRateLadderView>>;
  readonly playerProfile: KeyedQueryCache<Username, PlayerProfileLookup>;
  readonly userGameHistory: KeyedQueryCache<
    UserGameHistoryQuery,
    LadderPage<UserGameHistoryEntry>
  >;
  readonly characterFloorClearSnapshot: KeyedQueryCache<
    LadderCharacterFloorClearRecordId,
    CharacterFloorClearSnapshotView | undefined
  >;

  private readonly caches: (ReactiveNode & { clear(): void })[];

  constructor(clientApplication: ClientApplication) {
    // read through the application at call time: this is one of its field initializers, so anything
    // declared below it is still undefined at construction
    const queries = () => clientApplication.ladderQueries;

    this.experiencePointsLadder = new KeyedQueryCache(
      (query) => queries().getExperiencePointsLadderPage(query),
      (query) => keyOf(query.controlScheme, query.page)
    );
    this.floorClearTimes = new KeyedQueryCache(
      (query) => queries().getFloorClearTimes(query),
      (query) => keyOf(query.floor, query.page, query.controlSchemeOption, query.modeOption)
    );
    this.cumulativeClearTimes = new KeyedQueryCache(
      (query) => queries().getCumulativeClearTimes(query),
      (query) => keyOf(query.controlScheme, query.page)
    );
    this.floorClear = new KeyedQueryCache(
      (floorClearId) => queries().getFloorClear(floorClearId),
      (floorClearId) => keyOf(floorClearId)
    );
    this.gameRecord = new KeyedQueryCache(
      (gameRecordId) => queries().getGameRecord(gameRecordId),
      (gameRecordId) => keyOf(gameRecordId)
    );
    this.winRateLadder = new KeyedQueryCache(
      (query) => queries().getWinRateLadder(query),
      (query) => keyOf(query.page, query.minimumGamesPlayed, query.controlSchemeOption)
    );
    this.playerProfile = new KeyedQueryCache(
      (username) => queries().getPlayerProfile(username),
      (username) => keyOf(username)
    );
    this.userGameHistory = new KeyedQueryCache(
      (query) => queries().getUserGameHistory(query),
      (query) =>
        keyOf(
          query.username,
          query.page,
          query.dateRangeOption?.start,
          query.dateRangeOption?.end
        )
    );
    this.characterFloorClearSnapshot = new KeyedQueryCache(
      (snapshotId) => queries().getCharacterFloorClearSnapshot(snapshotId),
      (snapshotId) => keyOf(snapshotId)
    );

    this.caches = [
      this.experiencePointsLadder,
      this.floorClearTimes,
      this.cumulativeClearTimes,
      this.floorClear,
      this.gameRecord,
      this.winRateLadder,
      this.playerProfile,
      this.userGameHistory,
      this.characterFloorClearSnapshot,
    ];
  }

  makeObservable(): void {
    for (const cache of this.caches) {
      cache.makeObservable();
    }
  }

  clear(): void {
    for (const cache of this.caches) {
      cache.clear();
    }
  }
}

// spelled out per facet rather than stringifying the query object, so the field order is explicit
// and an added filter cannot silently start colliding with cached entries
function keyOf(...parts: (string | number | undefined)[]): string {
  return parts.map((part) => part ?? "").join("|");
}
