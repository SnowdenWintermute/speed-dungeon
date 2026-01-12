import {
  ChannelName,
  GameName,
  LOBBY_CHANNEL,
  Username,
  TaggedUserId,
} from "@speed-dungeon/common";
import { SocketId } from "./index.js";

export class BrowserTabSession {
  constructor(
    public socketId: SocketId,
    public username: Username,
    /** snowauth user id */
    public userId: TaggedUserId,
    public channels: ChannelName[] = [LOBBY_CHANNEL],
    public currentGameName: null | GameName = null,
    public currentPartyName: null | string = null
  ) {}
}
