import { ChannelName, ConnectionId } from "../../aliases.js";
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
    options?: { excludedIds?: ConnectionId[]; excludedChannels?: ChannelName[] }
  ): MessageDispatchFanOut<Sendable> {
    const excludedIds = options?.excludedIds || [];

    const excludedChannels = options?.excludedChannels || [];
    const connectionIdsFromExcludedChannels: ConnectionId[] = [];
    for (const excludedChannel of excludedChannels) {
      connectionIdsFromExcludedChannels.push(...this.userSessionRegistry.in(excludedChannel));
    }

    const connectionIds = this.userSessionRegistry
      .in(inChannel) // Returns all connectionIds whose sessions are currently subscribed to the given channel. Multiple entries may belong to the same user.
      .filter((id) => !excludedIds.includes(id))
      .filter((id) => !connectionIdsFromExcludedChannels.includes(id));

    return {
      type: MessageDispatchType.FanOut,
      connectionIds,
      message,
    };
  }
}
