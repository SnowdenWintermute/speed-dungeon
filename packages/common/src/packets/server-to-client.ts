export enum ServerToClientEvent {
  GameList = "0",
  ChannelFullUpdate = "1",
  UserJoinedChannel = "2",
  UserLeftChannel = "3",
}

export interface ServerToClientEventTypes {
  [ServerToClientEvent.GameList]: (gameList: GameListEntry[]) => void;
  [ServerToClientEvent.ChannelFullUpdate]: (
    channelName: string,
    userNames: string[]
  ) => void;
  [ServerToClientEvent.UserJoinedChannel]: (username: string) => void;
  [ServerToClientEvent.UserLeftChannel]: (username: string) => void;
}

export class GameListEntry {
  constructor(
    public gameName: string,
    public numberOfUsers: number,
    public timeStarted: undefined | number
  ) {}
}
