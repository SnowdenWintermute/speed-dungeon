import { SpeedDungeonGame } from "../game";

export enum ServerToClientEvent {
  GameList = "0",
  ChannelFullUpdate = "1",
  UserJoinedChannel = "2",
  UserLeftChannel = "3",
  ErrorMessage = "4",
  GameFullUpdate = "5",
  PartyNameUpdate = "6",
  PlayerChangedAdventuringParty = "7",
  PlayerLeftGame = "8",
  PlayerJoinedGame = "9",
  PartyCreated = "10",
}

export interface ServerToClientEventTypes {
  [ServerToClientEvent.GameList]: (gameList: GameListEntry[]) => void;
  [ServerToClientEvent.ChannelFullUpdate]: (channelName: string, userNames: string[]) => void;
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
