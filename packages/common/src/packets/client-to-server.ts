export enum ClientToServerEvent {
  RequestToJoinGame = "0",
  RequestsGameList = "1",
}

export interface ClientToServerEventTypes {
  [ClientToServerEvent.RequestToJoinGame]: (data: string) => void;
  [ClientToServerEvent.RequestsGameList]: () => void;
}
