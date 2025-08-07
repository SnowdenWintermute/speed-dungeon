import { ConsumableType } from "../../items/consumables/index.js";
import { CombatActionTarget } from "../index.js";
import { EntityId } from "../../primatives/index.js";
import { CombatActionName } from "./combat-action-names.js";

export class CombatActionExecutionIntent {
  constructor(
    public actionName: CombatActionName,
    public targets: CombatActionTarget,
    public level: number,
    public selectedConsumableId?: EntityId
  ) {}

  getConsumableType(): null | ConsumableType {
    return null;
  }
}
