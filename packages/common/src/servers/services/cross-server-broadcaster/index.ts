import { ChannelName, ConnectionId } from "../../../aliases.js";

export enum CrossServerBroadcastType {
  ChannelFanOut,
  ServerCommand,
}

export interface ChannelFanOutBroadcast<TPayload> {
  type: CrossServerBroadcastType.ChannelFanOut;
  channelName: ChannelName;
  payload: TPayload;
  excludedConnectionIds: ConnectionId[];
}

export interface ServerCommandBroadcast<TCommand> {
  type: CrossServerBroadcastType.ServerCommand;
  command: TCommand;
}

export type CrossServerBroadcast<TPayload, TCommand> =
  | ChannelFanOutBroadcast<TPayload>
  | ServerCommandBroadcast<TCommand>;

export type CrossServerBroadcastHandler<TPayload, TCommand> = (
  broadcast: CrossServerBroadcast<TPayload, TCommand>
) => void;

export interface CrossServerBroadcasterService<TPayload, TCommand> {
  publish(broadcast: CrossServerBroadcast<TPayload, TCommand>): Promise<void>;
  subscribe(handler: CrossServerBroadcastHandler<TPayload, TCommand>): Promise<void>;
  disconnect(): Promise<void>;
}
