import { GameName, Milliseconds, Username } from "../../../aliases.js";
import { ONE_SECOND } from "../../../app-consts.js";
import crypto from "crypto";
import { UserId } from "../../sessions/user-ids.js";

export class GameServerSessionClaimToken {
  readonly expirationTimestamp = GameServerSessionClaimToken.createExpirationTimestamp();
  readonly nonce = crypto.randomBytes(16).toString("hex");
  constructor(
    readonly gameName: GameName,
    readonly username: Username,
    readonly userId: UserId
  ) {}

  static readonly TimeToLive: Milliseconds = ONE_SECOND * 5 * 60;
  static createExpirationTimestamp() {
    return Date.now() + GameServerSessionClaimToken.TimeToLive;
  }
}
