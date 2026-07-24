import { GameStateUpdate, GameStateUpdateType } from "../../../packets/game-state-updates.js";
import { ERROR_MESSAGES } from "../../../errors/index.js";
import { LadderGameRecordsService } from "../../../ladder/records/ladder-records-service.js";
import { DateRange } from "../../../primatives/date-range.js";
import { invariant } from "../../../utils/index.js";
import { UserIdType } from "../../sessions/user-ids.js";
import { UserSession } from "../../sessions/user-session.js";
import { MessageDispatchFactory } from "../../update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../../update-delivery/outbox.js";

export class LadderGameRecordsController {
  constructor(
    private readonly ladderGameRecordsService: LadderGameRecordsService,
    private readonly updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>
  ) {}

  async getUserGameHistoryHandler(
    session: UserSession,
    data: { page: number; dateRange?: DateRange }
  ) {
    invariant(session.taggedUserId.type === UserIdType.Auth, ERROR_MESSAGES.AUTH.REQUIRED);
    const entries = await this.ladderGameRecordsService.getUserGameHistory(
      session.taggedUserId.id,
      data.page,
      data.dateRange
    );

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.UserGameHistoryPage,
      data: { page: data.page, entries },
    });
    return outbox;
  }

  async getUserGameRecordsCountHandler(session: UserSession, data: { dateRange?: DateRange }) {
    invariant(session.taggedUserId.type === UserIdType.Auth, ERROR_MESSAGES.AUTH.REQUIRED);
    const count = await this.ladderGameRecordsService.getUserGameRecordsCount(
      session.taggedUserId.id,
      data.dateRange
    );

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.UserGameRecordsCount,
      data: { count },
    });
    return outbox;
  }
}
