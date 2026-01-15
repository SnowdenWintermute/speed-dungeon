import { GameName, Milliseconds, Username } from "../../../aliases.js";
import { ONE_SECOND } from "../../../app-consts.js";
import { SodiumHelpers } from "../../../cryptography/index.js";
import { TaggedUserId } from "../../sessions/user-ids.js";
import crypto from "crypto";

// @TODO - get secret from some secret provider either local or process.env
const secret = "WFcB9xz20TzxKivwLv42Ow==";

export class GameServerSessionClaimToken {
  readonly expirationTimestamp = GameServerSessionClaimToken.createExpirationTimestamp();

  // @TODO - check this when claiming and keep track of them in a short term storage
  readonly nonce = crypto.randomBytes(16).toString("hex");
  constructor(
    readonly gameName: GameName,
    readonly username: Username,
    readonly taggedUserId: TaggedUserId
  ) {}

  static readonly TimeToLive: Milliseconds = ONE_SECOND * 5 * 60;
  static createExpirationTimestamp() {
    return Date.now() + GameServerSessionClaimToken.TimeToLive;
  }

  static async encrypt(token: GameServerSessionClaimToken): Promise<string> {
    return await SodiumHelpers.encrypt<GameServerSessionClaimToken>(token, secret);
  }

  static async decrypt(encrypted: string): Promise<GameServerSessionClaimToken> {
    return await SodiumHelpers.decrypt<GameServerSessionClaimToken>(encrypted, secret);
  }
}
