import { ConsumableType } from "../../items/consumables/index.js";
import { CombatActionTarget } from "../index.js";
import { EntityId, Milliseconds } from "../../primatives/index.js";
import { COMBAT_ACTION_NAME_STRINGS, CombatActionName } from "./combat-action-names.js";
import {
  ACTION_RESOLUTION_STEP_TYPE_STRINGS,
  ActionResolutionStepType,
} from "../../action-processing/index.js";
import { IdGenerator } from "../../utility-classes/index.js";

export class CombatActionExecutionIntent {
  private delaysByStep: Partial<Record<ActionResolutionStepType, Milliseconds>> = {};
  public id = new IdGenerator().generate();

  constructor(
    public actionName: CombatActionName,
    public rank: number,
    public targets: CombatActionTarget,
    public selectedConsumableId?: EntityId
  ) {}

  /** Should only be set by actions triggered by the server, such as setting timing for firewall burn */
  setDelayForStep(stepType: ActionResolutionStepType, delay: Milliseconds) {
    this.delaysByStep[stepType] = delay;
  }

  getDelayForStep(stepType: ActionResolutionStepType) {
    const toReturn = this.delaysByStep[stepType] || null;

    return toReturn;
  }

  getConsumableType(): null | ConsumableType {
    return null;
  }
}
