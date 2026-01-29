import { ChannelName, ConnectionId } from "../../aliases.js";
import { MessageDispatch, MessageDispatchFactory } from "./message-dispatch-factory.js";

export class MessageDispatchOutbox<Sendable> {
  private list: MessageDispatch<Sendable>[] = [];
  constructor(private dispatchFactory: MessageDispatchFactory<Sendable>) {}

  toDispatches(): readonly MessageDispatch<Sendable>[] {
    return this.list;
  }

  pushToConnection(to: ConnectionId, update: Sendable) {
    const dispatchOption = this.dispatchFactory.createSingle(to, update);
    if (dispatchOption) {
      this.list.push(dispatchOption);
    }
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
