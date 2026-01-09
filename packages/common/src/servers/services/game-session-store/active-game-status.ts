import { GameName } from "../../../aliases.js";

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
