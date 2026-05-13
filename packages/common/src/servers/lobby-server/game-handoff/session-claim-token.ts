import {
  EncryptedOpaqueToken,
  GameName,
  Milliseconds,
  PartyName,
  Username,
} from "../../../aliases.js";
import { ONE_SECOND } from "../../../app-consts.js";
import { SodiumHelpers } from "../../../cryptography/index.js";
import { GuestSessionReconnectionToken } from "../../game-server/reconnection/guest-session-reconnection-token.js";
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

export interface TokenCodec<T> {
  encode(token: T): Promise<EncryptedOpaqueToken>;
  decode(encoded: string): Promise<T>;
}

export class OpaqueEncryptionTokenCodec<T> implements TokenCodec<T> {
  constructor(private readonly secret: string) {}

  async encode(token: T): Promise<EncryptedOpaqueToken> {
    return (await SodiumHelpers.encrypt(token, this.secret)) as EncryptedOpaqueToken;
  }

  async decode(encoded: string): Promise<T> {
    return await SodiumHelpers.decrypt(encoded, this.secret);
  }
}
