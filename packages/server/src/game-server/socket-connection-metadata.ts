import { LOBBY_CHANNEL } from "@speed-dungeon/common";

export class SocketConnectionMetadata {
  constructor(
    public socketId: string,
    public username: string,
    public mainChannelName: string = LOBBY_CHANNEL,
    public currentGameName: null | string = null,
    public currentPartyName: null | string = null
  ) {}
}
