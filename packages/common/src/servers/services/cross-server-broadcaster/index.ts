import { ChannelName, ConnectionId } from "../../../aliases.js";

export interface CrossServerBroadcast<TPayload> {
  channelName: ChannelName;
  payload: TPayload;
  excludedConnectionIds: ConnectionId[];
}

export type CrossServerBroadcastHandler<TPayload> = (
  broadcast: CrossServerBroadcast<TPayload>
) => void;

export interface CrossServerBroadcasterService<TPayload> {
  publish(broadcast: CrossServerBroadcast<TPayload>): Promise<void>;
  subscribe(handler: CrossServerBroadcastHandler<TPayload>): Promise<void>;
  disconnect(): Promise<void>;
}
