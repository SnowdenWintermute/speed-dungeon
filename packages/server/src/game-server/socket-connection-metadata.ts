import { UserId, ChannelName, GameName, LOBBY_CHANNEL, Username } from "@speed-dungeon/common";
import { SocketId } from "./index.js";

export class BrowserTabSession {
  constructor(
    public socketId: SocketId,
    public username: Username,
    /** snowauth user id */
    public userId: UserId,
    public channels: ChannelName[] = [LOBBY_CHANNEL],
    public currentGameName: null | GameName = null,
    public currentPartyName: null | string = null
  ) {}
}
