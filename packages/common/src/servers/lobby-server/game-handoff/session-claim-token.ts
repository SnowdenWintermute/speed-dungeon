import { GameName, Milliseconds, Username } from "../../../aliases.js";
import { ONE_SECOND } from "../../../app-consts.js";
import { SodiumHelpers } from "../../../cryptography/index.js";
import { TaggedUserId } from "../../sessions/user-ids.js";
import crypto from "crypto";

// @TODO - get secret from some secret provider either local or process.env
const secret = "ZF0lw20QkbTIzBG5qYfcCw006+5+7EKyEXmEUCgHTK4=";

export class GameServerSessionClaimToken {
  readonly expirationTimestamp = GameServerSessionClaimToken.createExpirationTimestamp();

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

export interface SessionClaimTokenCodec {
  encode(token: GameServerSessionClaimToken): Promise<string>;
  decode(encoded: string): Promise<GameServerSessionClaimToken>;
}

export class OpaqueEncryptionSessionClaimTokenCodec implements SessionClaimTokenCodec {
  constructor(private readonly secret: string) {}

  async encode(token: GameServerSessionClaimToken): Promise<string> {
    return SodiumHelpers.encrypt(token, this.secret);
  }

  async decode(encoded: string): Promise<GameServerSessionClaimToken> {
    return SodiumHelpers.decrypt(encoded, this.secret);
  }
}

export class UntrustedLocalSessionClaimTokenCodec implements SessionClaimTokenCodec {
  async encode(token: GameServerSessionClaimToken): Promise<string> {
    return JSON.stringify(token);
  }

  async decode(encoded: string): Promise<GameServerSessionClaimToken> {
    return JSON.parse(encoded) as GameServerSessionClaimToken;
  }
}
