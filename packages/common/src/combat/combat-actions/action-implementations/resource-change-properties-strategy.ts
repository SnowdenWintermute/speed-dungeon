import { ResourceChangePropertiesGetters } from "../../../types.js";
import { CombatActionName } from "../combat-action-names.js";
import { COMBAT_ACTIONS } from "./index.js";

export abstract class ResourceChangePropertiesStrategy {
  abstract getResourceChangePropertiesGetters(
    actionName: CombatActionName
  ): ResourceChangePropertiesGetters;
}

export class RealResourceChangePropertiesStrategy extends ResourceChangePropertiesStrategy {
  getResourceChangePropertiesGetters(
    actionName: CombatActionName
  ): ResourceChangePropertiesGetters {
    const action = COMBAT_ACTIONS[actionName];
    return action.hitOutcomeProperties.resourceChangePropertiesGetters;
  }
}
