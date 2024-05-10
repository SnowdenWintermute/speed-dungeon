import { SpeedDungeonGame } from "../game";

export enum ServerToClientEvent {
  GameList = "0",
  ChannelFullUpdate = "1",
  UserJoinedChannel = "2",
  UserLeftChannel = "3",
  ErrorMessage = "4",
  GameFullUpdate = "5",
}

export interface ServerToClientEventTypes {
  [ServerToClientEvent.GameList]: (gameList: GameListEntry[]) => void;
  [ServerToClientEvent.ChannelFullUpdate]: (
    channelName: string,
    userNames: string[]
  ) => void;
  [ServerToClientEvent.UserJoinedChannel]: (username: string) => void;
  [ServerToClientEvent.UserLeftChannel]: (username: string) => void;
  [ServerToClientEvent.ErrorMessage]: (message: string) => void;
  [ServerToClientEvent.GameFullUpdate]: (
    game: undefined | SpeedDungeonGame
  ) => void;
}

export class GameListEntry {
  constructor(
    public gameName: string,
    public numberOfUsers: number,
    public timeStarted: undefined | number
  ) {}
}
