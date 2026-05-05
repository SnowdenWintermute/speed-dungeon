import {
  GameName,
  GameServerName,
  GuestSessionReconnectionToken,
  Milliseconds,
  PartyName,
  Username,
} from "../../../aliases.js";
import { ONE_SECOND } from "../../../app-consts.js";
import { SodiumHelpers } from "../../../cryptography/index.js";
import { TaggedUserId } from "../../sessions/user-ids.js";
import crypto from "crypto";

export class GameServerSessionClaimToken {
  readonly expirationTimestamp = GameServerSessionClaimToken.createExpirationTimestamp();

  readonly nonce = crypto.randomBytes(16).toString("hex");
  constructor(
    readonly gameName: GameName,
    readonly partyName: PartyName,
    readonly username: Username,
    readonly taggedUserId: TaggedUserId,
    readonly gameServerUrl: string,
    readonly reconnectionTokenOption?: GuestSessionReconnectionToken
  ) {}

  static readonly TimeToLive: Milliseconds = ONE_SECOND * 5 * 60;
  static createExpirationTimestamp() {
    return Date.now() + GameServerSessionClaimToken.TimeToLive;
  }
}

export interface GameServerSessionClaimTokenCodec {
  encode(token: GameServerSessionClaimToken): Promise<string>;
  decode(encoded: string): Promise<GameServerSessionClaimToken>;
}

export class OpaqueEncryptionSessionClaimTokenCodec implements GameServerSessionClaimTokenCodec {
  constructor(private readonly secret: string) {}

  async encode(token: GameServerSessionClaimToken): Promise<string> {
    return await SodiumHelpers.encrypt(token, this.secret);
  }

  async decode(encoded: string): Promise<GameServerSessionClaimToken> {
    return await SodiumHelpers.decrypt(encoded, this.secret);
  }
}

export class UntrustedLocalSessionClaimTokenCodec implements GameServerSessionClaimTokenCodec {
  async encode(token: GameServerSessionClaimToken): Promise<string> {
    return JSON.stringify(token);
  }

  async decode(encoded: string): Promise<GameServerSessionClaimToken> {
    return JSON.parse(encoded) as GameServerSessionClaimToken;
  }
}
