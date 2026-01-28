import { ChannelName, ConnectionId } from "../../aliases.js";
import {
  MessageDispatch,
  MessageDispatchFactory,
  MessageDispatchType,
} from "./message-dispatch-factory.js";

export class MessageDispatchOutbox<Sendable> {
  private list: MessageDispatch<Sendable>[] = [];
  constructor(private dispatchFactory: MessageDispatchFactory<Sendable>) {}

  toDispatches(): readonly MessageDispatch<Sendable>[] {
    return this.list;
  }

  removeRecipients(connectionIds: ConnectionId[]) {
    const newList: MessageDispatch<Sendable>[] = [];

    for (const dispatch of this.list) {
      if (dispatch.type === MessageDispatchType.Single) {
        if (connectionIds.includes(dispatch.connectionId)) {
          continue;
        }
      } else {
        dispatch.connectionIds = dispatch.connectionIds.filter((id) => !connectionIds.includes(id));
        if (dispatch.connectionIds.length === 0) {
          continue;
        }
      }
      newList.push(dispatch);
    }

    this.list = newList;
  }

  pushToConnection(to: ConnectionId, update: Sendable) {
    this.list.push(this.dispatchFactory.createSingle(to, update));
  }

  pushToChannel(
    inChannel: ChannelName,
    update: Sendable,
    options?: { excludedIds?: ConnectionId[]; excludedChannels?: ChannelName[] }
  ) {
    this.list.push(this.dispatchFactory.createFanOut(inChannel, update, options));
  }

  pushFromOther(other: MessageDispatchOutbox<Sendable>) {
    this.list.push(...other.toDispatches());
  }
}
