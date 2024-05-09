export enum ClientToServerEvent {
  RequestToJoinGame = "0",
  RequestsGameList = "1",
  CreateGame = "2",
}

export interface ClientToServerEventTypes {
  [ClientToServerEvent.RequestToJoinGame]: (gameName: string) => void;
  [ClientToServerEvent.RequestsGameList]: () => void;
  [ClientToServerEvent.CreateGame]: (gameName: string) => void;
}
