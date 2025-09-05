import { ConsumableType } from "../../items/consumables/index.js";
import { CombatActionTarget } from "../index.js";
import { EntityId, Milliseconds } from "../../primatives/index.js";
import { CombatActionName } from "./combat-action-names.js";
import { ActionResolutionStepType } from "../../action-processing/index.js";

export class CombatActionExecutionIntent {
  private delaysByStep: Partial<Record<ActionResolutionStepType, Milliseconds>> = {};
  constructor(
    public actionName: CombatActionName,
    public targets: CombatActionTarget,
    public level: number,
    public selectedConsumableId?: EntityId
  ) {}

  /** Should only be set by actions triggered by the server, such as setting timing for firewall burn */
  setDelayForStep(stepType: ActionResolutionStepType, delay: Milliseconds) {
    this.delaysByStep[stepType] = delay;
  }
  getDelayForStep(stepType: ActionResolutionStepType, delay: Milliseconds) {
    return this.delaysByStep[stepType] || null;
  }

  getConsumableType(): null | ConsumableType {
    return null;
  }
}
