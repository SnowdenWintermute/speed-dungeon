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
  FloorClearTimesQuery,
  FloorClearView,
  PlayerProfileView,
  Username,
  WinRateLadderQuery,
  WinRateLadderView,
  invariant,
} from "@speed-dungeon/common";
import { ClientApplication } from ".";
import { ClientSingleton } from "./clients/singleton";
import { LobbyClient } from "./clients/lobby";
import { ErrorRecordService } from "./error-record-service";

export class RemoteLadderQueries implements LadderQueries {
  private lobbyClientRef: ClientSingleton<LobbyClient>;
  private errorRecordService: ErrorRecordService;
  private pendingQueries = new Map<
    number,
    { resolve: (result: LadderQueryResult) => void; reject: (error: Error) => void }
  >();

  constructor(clientApplication: ClientApplication) {
    this.lobbyClientRef = clientApplication.lobbyClientRef;
    this.errorRecordService = clientApplication.errorRecordService;
  }

  async getFloorClearTimes(query: FloorClearTimesQuery): Promise<LadderPage<FloorClearView>> {
    const result = await this.send({ type: LadderQueryType.FloorClearTimes, query });
    invariant(result.type === LadderQueryType.FloorClearTimes, WRONG_RESULT_TYPE);
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

  async getPlayerProfile(username: Username): Promise<PlayerProfileView | undefined> {
    const result = await this.send({ type: LadderQueryType.PlayerProfile, username });
    invariant(result.type === LadderQueryType.PlayerProfile, WRONG_RESULT_TYPE);
    return result.profileOption;
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
    const lobbyClient = this.lobbyClientRef.get();
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
    const errorOption = this.errorRecordService.getErrorForIntent(clientIntentSequenceId);
    pendingOption.reject(new Error(errorOption?.message ?? ERROR_MESSAGES.SERVER_GENERIC));
  }
}

const WRONG_RESULT_TYPE = "the ladder query result did not answer the query that was sent";
