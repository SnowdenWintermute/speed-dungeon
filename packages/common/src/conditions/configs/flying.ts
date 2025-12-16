import { Vector3 } from "@babylonjs/core";
import { CombatActionIntent } from "../../combat/combat-actions/index.js";
import { TransformModifiers } from "../../scene-entities/index.js";
import { CombatantConditionInit } from "../condition-config.js";
import {
  ActionUserContext,
  CombatActionExecutionIntent,
  CombatActionName,
  CombatActionTargetType,
  Combatant,
  CombatantCondition,
  IdGenerator,
  Meters,
  runIfInBrowser,
} from "../../index.js";
import makeAutoObservable from "mobx-store-inheritance";

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
