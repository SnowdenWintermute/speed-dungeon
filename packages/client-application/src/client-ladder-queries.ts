import {
  ClientIntentReply,
  ClientIntentType,
  ERROR_MESSAGES,
  LadderCharacterFloorClearRecordId,
  LadderPage,
  LadderQueries,
  LadderQueryRequest,
  LadderQueryResult,
  LadderQueryType,
  CharacterFloorClearSnapshotView,
  CumulativeClearTimesQuery,
  ExperiencePointsLadderQuery,
  ExperiencePointsLadderViewEntry,
  FloorClearTimesQuery,
  FloorClearView,
  PlayerProfileLookup,
  UserGameHistoryEntry,
  UserGameHistoryQuery,
  Username,
  WinRateLadderQuery,
  WinRateLadderView,
  invariant,
} from "@speed-dungeon/common";
import { ClientApplication } from ".";

// the client's LadderQueries: dispatches each call to whatever server it is connected to, over
// whatever endpoint that is (a websocket online, an in-memory one offline). LocalLadderQueries is
// the implementation on the other side, executing in-process against ladder records
export class ClientLadderQueries implements LadderQueries {
  private pendingQueries = new Map<
    number,
    { resolve: (result: LadderQueryResult) => void; reject: (error: Error) => void }
  >();

  // reached through the application rather than captured here: this is built as one of its field
  // initializers, so anything declared below it is still undefined at construction time
  constructor(private readonly clientApplication: ClientApplication) {}

  async getExperiencePointsLadderPage(
    query: ExperiencePointsLadderQuery
  ): Promise<LadderPage<ExperiencePointsLadderViewEntry>> {
    const result = await this.send({ type: LadderQueryType.ExperiencePointsLadder, query });
    invariant(result.type === LadderQueryType.ExperiencePointsLadder, WRONG_RESULT_TYPE);
    return result.page;
  }

  async getFloorClearTimes(query: FloorClearTimesQuery): Promise<LadderPage<FloorClearView>> {
    const result = await this.send({ type: LadderQueryType.FloorClearTimes, query });
    invariant(result.type === LadderQueryType.FloorClearTimes, WRONG_RESULT_TYPE);
    return result.page;
  }

  async getCumulativeClearTimes(
    query: CumulativeClearTimesQuery
  ): Promise<LadderPage<FloorClearView>> {
    const result = await this.send({ type: LadderQueryType.CumulativeClearTimes, query });
    invariant(result.type === LadderQueryType.CumulativeClearTimes, WRONG_RESULT_TYPE);
    return result.page;
  }

  async getWinRateLadder(query: WinRateLadderQuery): Promise<LadderPage<WinRateLadderView>> {
    const result = await this.send({ type: LadderQueryType.WinRateLadder, query });
    invariant(result.type === LadderQueryType.WinRateLadder, WRONG_RESULT_TYPE);
    return result.page;
  }

  async getCharacterFloorClearSnapshot(
    snapshotId: LadderCharacterFloorClearRecordId
  ): Promise<CharacterFloorClearSnapshotView | undefined> {
    const result = await this.send({
      type: LadderQueryType.CharacterFloorClearSnapshot,
      snapshotId,
    });
    invariant(result.type === LadderQueryType.CharacterFloorClearSnapshot, WRONG_RESULT_TYPE);
    return result.snapshotOption;
  }

  async getPlayerProfile(username: Username): Promise<PlayerProfileLookup> {
    const result = await this.send({ type: LadderQueryType.PlayerProfile, username });
    invariant(result.type === LadderQueryType.PlayerProfile, WRONG_RESULT_TYPE);
    return result.lookup;
  }

  async getUserGameHistory(
    query: UserGameHistoryQuery
  ): Promise<LadderPage<UserGameHistoryEntry>> {
    const result = await this.send({ type: LadderQueryType.UserGameHistory, query });
    invariant(result.type === LadderQueryType.UserGameHistory, WRONG_RESULT_TYPE);
    return result.page;
  }

  receiveResult(reply: ClientIntentReply & { result: LadderQueryResult }) {
    const pendingOption = this.pendingQueries.get(reply.clientIntentSequenceId);
    if (pendingOption === undefined) {
      return;
    }
    this.pendingQueries.delete(reply.clientIntentSequenceId);
    pendingOption.resolve(reply.result);
  }

  private send(request: LadderQueryRequest): Promise<LadderQueryResult> {
    const lobbyClient = this.clientApplication.lobbyClientRef.get();
    const clientIntentSequenceId = lobbyClient.dispatchIntent({
      type: ClientIntentType.LadderQuery,
      data: request,
    });

    const resultPromise = new Promise<LadderQueryResult>((resolve, reject) => {
      this.pendingQueries.set(clientIntentSequenceId, { resolve, reject });
    });

    // the server closes every intent's update stream, so a query still pending by then failed
    lobbyClient
      .waitForServerReply(clientIntentSequenceId)
      .then(() => this.failIfStillPending(clientIntentSequenceId));

    return resultPromise;
  }

  // a reconnect restarts the intent sequence, so anything still waiting can never be answered and
  // its id would go on to collide with a fresh intent's
  failAllPendingQueries() {
    const pending = [...this.pendingQueries.values()];
    this.pendingQueries.clear();
    for (const { reject } of pending) {
      reject(new Error(ERROR_MESSAGES.SERVER_GENERIC));
    }
  }

  private failIfStillPending(clientIntentSequenceId: number) {
    const pendingOption = this.pendingQueries.get(clientIntentSequenceId);
    if (pendingOption === undefined) {
      return;
    }
    this.pendingQueries.delete(clientIntentSequenceId);
    const errorOption =
      this.clientApplication.errorRecordService.getErrorForIntent(clientIntentSequenceId);
    pendingOption.reject(new Error(errorOption?.message ?? ERROR_MESSAGES.SERVER_GENERIC));
  }
}

const WRONG_RESULT_TYPE = "the ladder query result did not answer the query that was sent";
