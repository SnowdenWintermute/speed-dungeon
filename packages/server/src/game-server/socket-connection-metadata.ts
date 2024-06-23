import { LOBBY_CHANNEL } from "@speed-dungeon/common";
import { SocketId, Username } from ".";

export class BrowserTabSession {
  constructor(
    public socketId: SocketId,
    public username: Username,
    public mainChannelName: string = LOBBY_CHANNEL,
    public currentGameName: null | string = null,
    public currentPartyName: null | string = null
  ) {}
}
