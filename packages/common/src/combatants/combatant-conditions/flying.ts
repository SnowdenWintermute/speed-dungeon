import { CombatantCondition, CombatantConditionName, ConditionAppliedBy } from "./index.js";
import { CombatActionIntent, CombatActionName } from "../../combat/combat-actions/index.js";
import { EntityId, MaxAndCurrent, Meters } from "../../primatives/index.js";
import { CombatantProperties } from "../combatant-properties.js";
import { runIfInBrowser } from "../../utils/index.js";
import makeAutoObservable from "mobx-store-inheritance";
import { TransformModifiers } from "../../scene-entities/index.js";
import { Vector3 } from "@babylonjs/core";

const FLYING_HEIGHT: Meters = 2;

export class FlyingCombatantCondition extends CombatantCondition {
  intent = CombatActionIntent.Benevolent;
  removedOnDeath: boolean = true;
  ticks?: MaxAndCurrent | undefined = undefined;
  constructor(
    id: EntityId,
    appliedBy: ConditionAppliedBy,
    appliedTo: EntityId,
    public level: number,
    stacksOption: null | MaxAndCurrent
  ) {
    super(id, appliedBy, appliedTo, CombatantConditionName.Flying, stacksOption);
    runIfInBrowser(() => makeAutoObservable(this));
  }

  tickPropertiesOption = null;

  getAiTypesAppliedToTarget() {
    return [];
  }

  getDescription(): string {
    return `Untargetable by most melee attacks`;
  }

  getAttributeModifiers(self: CombatantCondition, appliedTo: CombatantProperties) {
    return {};
  }

  triggeredWhenHitBy(actionName: CombatActionName) {
    return false;
  }

  triggeredWhenActionUsed() {
    return false;
  }

  onTriggered() {
    return {
      numStacksRemoved: this.stacksOption?.current || 0,
      triggeredActions: [],
    };
  }

  getCosmeticEffectWhileActive = (combatantId: EntityId) => {
    return [];
  };

  getTransformModifiers(): TransformModifiers {
    return { homePosition: new Vector3(0, FLYING_HEIGHT, 0) };
  }
}
