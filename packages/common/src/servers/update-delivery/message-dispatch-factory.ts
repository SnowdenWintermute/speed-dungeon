import { ChannelName, ConnectionId } from "../../index.js";
import { UserSessionRegistry } from "../sessions/user-session-registry.js";

export enum MessageDispatchType {
  Single,
  FanOut,
}

export interface MessageDispatchSingle<Sendable> {
  type: MessageDispatchType.Single;
  message: Sendable;
  connectionId: ConnectionId;
}

export interface MessageDispatchFanOut<Sendable> {
  type: MessageDispatchType.FanOut;
  message: Sendable;
  connectionIds: ConnectionId[];
}

export type MessageDispatch<Sendable> =
  | MessageDispatchSingle<Sendable>
  | MessageDispatchFanOut<Sendable>;

export class MessageDispatchFactory<Sendable> {
  constructor(private readonly userSessionRegistry: UserSessionRegistry) {}

  createSingle(to: ConnectionId, message: Sendable): MessageDispatchSingle<Sendable> {
    return {
      type: MessageDispatchType.Single,
      connectionId: to,
      message,
    };
  }

  createFanOut(
    inChannel: ChannelName,
    message: Sendable,
    options?: { excludedIds: ConnectionId[] }
  ): MessageDispatchFanOut<Sendable> {
    const excludedIds = options?.excludedIds || [];
    const connectionIds = this.userSessionRegistry
      .in(inChannel)
      .filter((id) => !excludedIds.includes(id));

    return {
      type: MessageDispatchType.FanOut,
      connectionIds,
      message,
    };
  }
}
