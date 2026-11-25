import { CombatantId, EntityId } from "../aliases.js";
import { ConditionAppliedBy } from "./condition-applied-by.js";
import { CombatantConditionName } from "./condition-names.js";

export interface CombatantConditionInit {
  name: CombatantConditionName;
  rank: number;
  id: EntityId;
  appliedBy: ConditionAppliedBy;
  appliedTo: CombatantId;
  stacks: number | null;
}
