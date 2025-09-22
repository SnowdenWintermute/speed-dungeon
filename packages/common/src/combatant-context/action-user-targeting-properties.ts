import { Option } from "../primatives/option.js";
import { CombatActionName, TargetingScheme } from "../combat/combat-actions/index.js";
import { CombatActionTarget } from "../combat/targeting/combat-action-targets.js";
import { EntityId } from "../primatives/index.js";

export interface ActionAndRank {
  actionName: CombatActionName;
  rank: number;
}

export class ActionUserTargetingProperties {
  private selectedActionAndRank: Option<ActionAndRank> = null;
  private selectedTarget: Option<CombatActionTarget> = null;
  private selectedTargetingScheme: Option<TargetingScheme> = null;
  private selectedItemId: Option<EntityId> = null;
  constructor() {}

  clear() {
    this.selectedActionAndRank = null;
    this.selectedTarget = null;
    this.selectedTargetingScheme = null;
    this.selectedItemId = null;
  }

  getSelectedActionAndRank() {
    return this.selectedActionAndRank;
  }
  getSelectedTarget() {
    return this.selectedTarget;
  }
  getSelectedTargetingScheme() {
    return this.selectedTargetingScheme;
  }
  getSelectedItemId() {
    return this.selectedItemId;
  }

  setSelectedActionAndRank(actionAndRank: Option<ActionAndRank>) {
    this.selectedActionAndRank = actionAndRank;
  }
  setSelectedTarget(targetOption: Option<CombatActionTarget>) {
    this.selectedTarget = targetOption;
  }
  setSelectedTargetingScheme(selectedTargetingSchemeOption: Option<TargetingScheme>) {
    this.selectedTargetingScheme = selectedTargetingSchemeOption;
  }
  setSelectedItemId(itemIdOption: Option<EntityId>) {
    this.selectedItemId = itemIdOption;
  }
}
