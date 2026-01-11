import { GameName } from "../../../aliases.js";
/** 
   used by the lobby lobby to check if this game still exists when a user reconnects to the lobby
   after disconnection from the game server
   */
export class ActiveGameStatus {
  private lastHeartbeatTimestamp: number = Date.now();
  constructor(
    public readonly name: GameName,
    public readonly id: string
  ) {}

  onHeartbeat() {
    this.lastHeartbeatTimestamp = Date.now();
  }

  isStale() {
    //
  }
}
