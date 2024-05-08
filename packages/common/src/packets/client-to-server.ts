export enum ClientToServerEvents {
  RequestToJoinRoom = "0",
}

export interface ClientToServerEventTypes {
  [ClientToServerEvents.RequestToJoinRoom]: (data: string) => void;
}
