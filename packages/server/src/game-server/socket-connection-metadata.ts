import { LOBBY_CHANNEL } from "@speed-dungeon/common";
import { SocketId, Username } from "./index.js";

export class BrowserTabSession {
  constructor(
    public socketId: SocketId,
    public username: Username,
    /** snowauth user id */
    public userId: null | number,
    public channels: string[] = [LOBBY_CHANNEL],
    public currentGameName: null | string = null,
    public currentPartyName: null | string = null
  ) {}
}
