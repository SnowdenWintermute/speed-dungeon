import { GameServerName } from "../../../aliases.js";

export interface GameServerConnectionInstructions {
  name: GameServerName;
  url: string;
  encryptedSessionClaimToken: string;
}
