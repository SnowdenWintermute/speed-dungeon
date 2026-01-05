import { GameName, SessionClaimId } from "../../../aliases.js";

export class GameServerSessionClaimToken {
  // asymmetric signature signed by lobby server's private key
  // contains the sessionClaimId and expirationTimestamp to prove
  // the client has not tampered with them
  readonly signature: string = "";
  constructor(
    readonly sessionClaimId: SessionClaimId,
    readonly gameName: GameName,
    readonly expirationTimestamp: number
  ) {}
}
