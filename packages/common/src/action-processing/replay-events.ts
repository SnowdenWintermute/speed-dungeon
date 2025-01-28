import { GameUpdateCommand } from "./game-update-commands.js";

export class ReplayEventNode {
  events: { command: GameUpdateCommand; resolutionOrderId: number }[] = [];
  children: ReplayEventNode[] = [];
  constructor() {}
}
