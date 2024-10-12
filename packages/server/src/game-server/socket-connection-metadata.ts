import { LOBBY_CHANNEL, UserAuthStatus } from "@speed-dungeon/common";
import { SocketId, Username } from "./index.js";

export class BrowserTabSession {
  constructor(
    public socketId: SocketId,
    public username: Username,
    public authStatus: UserAuthStatus,
    public channelName: string = LOBBY_CHANNEL,
    public currentGameName: null | string = null,
    public currentPartyName: null | string = null
  ) {}
}
