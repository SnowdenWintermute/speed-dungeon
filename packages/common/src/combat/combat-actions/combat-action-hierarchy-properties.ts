import { CombatActionComponent, CombatActionExecutionIntent } from "./index.js";
import { ActionResolutionStepContext } from "../../action-processing/index.js";

export interface CombatActionHierarchyProperties {
  getChildren: (context: ActionResolutionStepContext) => CombatActionComponent[];
  getConcurrentSubActions?: (context: ActionResolutionStepContext) => CombatActionExecutionIntent[];
  getParent: () => CombatActionComponent | null;
}
