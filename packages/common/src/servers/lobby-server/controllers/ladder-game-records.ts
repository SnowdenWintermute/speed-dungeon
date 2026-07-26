import { GameStateUpdate, GameStateUpdateType } from "../../../packets/game-state-updates.js";
import { LadderQueries } from "../../../ladder/queries/ladder-queries.js";
import {
  executeLadderQuery,
  LadderQueryRequest,
} from "../../../ladder/queries/ladder-query-messages.js";
import { UserSession } from "../../sessions/user-session.js";
import { MessageDispatchFactory } from "../../update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../../update-delivery/outbox.js";

export class LadderGameRecordsController {
  constructor(
    private readonly ladderQueries: LadderQueries,
    private readonly updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>
  ) {}

  async ladderQueryHandler(session: UserSession, request: LadderQueryRequest) {
    const clientIntentSequenceId = session.currentIntentSequenceId;
    const result = await executeLadderQuery(this.ladderQueries, request);

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.LadderQueryResult,
      data: { clientIntentSequenceId, result },
    });
    return outbox;
  }

}
