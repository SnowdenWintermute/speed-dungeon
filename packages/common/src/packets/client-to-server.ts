import { CombatantClass } from "../combatants";

export enum ClientToServerEvent {
  RequestToJoinGame = "0",
  RequestsGameList = "1",
  CreateGame = "2",
  JoinGame = "3",
  LeaveGame = "4",
  CreateParty = "5",
  JoinParty = "6",
  LeaveParty = "7",
  ToggleReadyToStartGame = "8",
  CreateCharacter = "9",
}

export interface ClientToServerEventTypes {
  [ClientToServerEvent.RequestToJoinGame]: (gameName: string) => void;
  [ClientToServerEvent.RequestsGameList]: () => void;
  [ClientToServerEvent.CreateGame]: (gameName: string) => void;
  [ClientToServerEvent.JoinGame]: (gameName: string) => void;
  [ClientToServerEvent.LeaveGame]: () => void;
  [ClientToServerEvent.CreateParty]: (partyName: string) => void;
  [ClientToServerEvent.JoinParty]: (partyName: string) => void;
  [ClientToServerEvent.LeaveParty]: () => void;
  [ClientToServerEvent.ToggleReadyToStartGame]: () => void;
  [ClientToServerEvent.CreateCharacter]: (
    characterName: string,
    combatantClass: CombatantClass
  ) => void;
}
