import { Vector3 } from "@babylonjs/core";
import {
  CombatActionExecutionIntent,
  CombatActionIntent,
  CombatActionName,
} from "../../combat/combat-actions/index.js";
import { TransformModifiers } from "../../scene-entities/index.js";
import { CombatantConditionInit } from "../condition-config.js";
import makeAutoObservable from "mobx-store-inheritance";
import { Meters } from "../../aliases.js";
import { runIfInBrowser } from "../../utils/index.js";
import { ActionUserContext } from "../../action-user-context/index.js";
import { Combatant } from "../../combatants/index.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { CombatActionTargetType } from "../../combat/targeting/combat-action-targets.js";
import { CombatantCondition } from "../index.js";

const FLYING_HEIGHT: Meters = 2;

export class FlyingCondition extends CombatantCondition {
  constructor(init: CombatantConditionInit) {
    super(init);

    runIfInBrowser(() => makeAutoObservable(this));
  }

  intent = CombatActionIntent.Benevolent;

  getDescription = () => {
    return `Unreachable by non-flying melee attackers`;
  };

  getTransformModifiers(): TransformModifiers {
    return { homePosition: new Vector3(0, FLYING_HEIGHT, 0) };
  }

  triggeredWhenHitBy = [
    // CombatActionName.Fire,
    CombatActionName.EnsnareMoveNetTowardTargetAndActivate,
  ];

  onTriggered(
    this: CombatantCondition,
    actionUserContext: ActionUserContext,
    targetCombatant: Combatant,
    idGenerator: IdGenerator
  ) {
    const actionUser = actionUserContext.party.combatantManager.getExpectedCombatant(
      this.getConditionAppliedTo()
    );

    const actionExecutionIntent = new CombatActionExecutionIntent(
      CombatActionName.FallTowardsHomePosition,
      1,
      { type: CombatActionTargetType.Single, targetId: actionUser.getEntityId() }
    );

    return {
      numStacksRemoved: this.stacksOption?.current || 1,
      triggeredActions: [
        {
          user: actionUser,

          actionExecutionIntent,
        },
      ],
    };
  }
}
