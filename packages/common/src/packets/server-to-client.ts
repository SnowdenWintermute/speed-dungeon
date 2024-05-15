import { SpeedDungeonGame } from "../game";

export enum ServerToClientEvent {
  GameList = "0",
  ClientUsername = "1",
  ChannelFullUpdate = "2",
  UserJoinedChannel = "3",
  UserLeftChannel = "4",
  ErrorMessage = "5",
  GameFullUpdate = "6",
  PartyNameUpdate = "7",
  PlayerChangedAdventuringParty = "8",
  PlayerLeftGame = "9",
  PlayerJoinedGame = "10",
  PartyCreated = "11",
}

export interface ServerToClientEventTypes {
  [ServerToClientEvent.GameList]: (gameList: GameListEntry[]) => void;
  [ServerToClientEvent.ChannelFullUpdate]: (channelName: string, userNames: string[]) => void;
  [ServerToClientEvent.ClientUsername]: (username: string) => void;
  [ServerToClientEvent.UserJoinedChannel]: (username: string) => void;
  [ServerToClientEvent.UserLeftChannel]: (username: string) => void;
  [ServerToClientEvent.ErrorMessage]: (message: string) => void;
  [ServerToClientEvent.GameFullUpdate]: (game: null | SpeedDungeonGame) => void;
  [ServerToClientEvent.PartyNameUpdate]: (partyName: null | string) => void;
  [ServerToClientEvent.PlayerChangedAdventuringParty]: (
    playerName: string,
    partyName: null | string
  ) => void;
  [ServerToClientEvent.PlayerLeftGame]: (userame: string) => void;
  [ServerToClientEvent.PlayerJoinedGame]: (userame: string) => void;
  [ServerToClientEvent.PartyCreated]: (partyName: string) => void;
}

export class GameListEntry {
  constructor(
    public gameName: string,
    public numberOfUsers: number,
    public timeStarted: null | number
  ) {}
}
