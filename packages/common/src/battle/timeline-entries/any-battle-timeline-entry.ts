import { ActionEntityBattleTimelineEntry } from "./action-entity-timeline-entry.js";
import { CombatantBattleTimelineEntry } from "./combatant-timeline-entry.js";
import { ConditionBattleTimelineEntry } from "./condition-timeline-entry.js";

export type AnyBattleTimelineEntry =
  CombatantBattleTimelineEntry | ConditionBattleTimelineEntry | ActionEntityBattleTimelineEntry;
