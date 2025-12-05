import { CombatantCondition, CombatantConditionName, ConditionAppliedBy } from "./index.js";
import {
  CombatActionExecutionIntent,
  CombatActionIntent,
  CombatActionName,
} from "../../combat/combat-actions/index.js";
import { EntityId, MaxAndCurrent, Meters } from "../../primatives/index.js";
import { CombatantProperties } from "../combatant-properties.js";
import { runIfInBrowser } from "../../utils/index.js";
import makeAutoObservable from "mobx-store-inheritance";
import { TransformModifiers } from "../../scene-entities/index.js";
import { Vector3 } from "@babylonjs/core";
import { ActionIntentAndUser } from "../../action-processing/index.js";
import { ActionUserContext } from "../../action-user-context/index.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { Combatant } from "../index.js";
import { CombatActionTargetType } from "../../combat/targeting/combat-action-targets.js";

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
    if (actionName === CombatActionName.Fire) {
      return true;
    }
    return false;
  }

  triggeredWhenActionUsed() {
    return false;
  }

  onTriggered(
    context: ActionUserContext,
    targetCombatant: Combatant,
    idGenerator: IdGenerator
  ): { numStacksRemoved: number; triggeredActions: ActionIntentAndUser[] } {
    const actionUser = context.party.combatantManager.getExpectedCombatant(
      this.getConditionAppliedTo()
    );
    console.log("triggering fall toward home position used by target :", actionUser);

    return {
      numStacksRemoved: this.stacksOption?.current || 1,
      triggeredActions: [
        {
          user: actionUser,
          actionExecutionIntent: new CombatActionExecutionIntent(
            CombatActionName.FallTowardsHomePosition,
            1,
            { type: CombatActionTargetType.Single, targetId: actionUser.getEntityId() }
          ),
        },
      ],
    };
  }

  getCosmeticEffectWhileActive = (combatantId: EntityId) => {
    return [];
  };

  getTransformModifiers(): TransformModifiers {
    return { homePosition: new Vector3(0, FLYING_HEIGHT, 0) };
  }
}
