import { ActionIntentAndUser } from "../../action-processing/index.js";
import { ActionUserContext } from "../../action-user-context/index.js";
import { CombatantCondition } from "./index.js";

export interface ConditionTickProperties {
  getTickSpeed(condition: CombatantCondition): number;
  onTick(context: ActionUserContext): {
    numStacksRemoved: number;
    triggeredAction: {
      actionIntentAndUser: ActionIntentAndUser;
      getConsumableType?: () => null;
    };
  };
}
