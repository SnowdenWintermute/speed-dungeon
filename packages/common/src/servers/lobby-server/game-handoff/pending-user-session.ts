import { GameName, PartyName, Username } from "../../../aliases.js";
import { UserId } from "../../sessions/user-ids.js";

/** Will be used to create the UserSession on the game server when user presents a vaild claim token */
export class PendingGameServerUserSession {
  constructor(
    public readonly userId: UserId,
    // username at time of game creation, used to link to the player since games store players
    // by username so we don't leak userIds to clients
    // when creating a reconnection session,
    // including this ensures that if a user changed their username or were assigned a different guest
    // username in between disconnecting and reconnecting that they will show as the correct name in the game
    public readonly playerUsername: Username,
    public currentGameName: GameName,
    public currentPartyName: PartyName
  ) {}
}
