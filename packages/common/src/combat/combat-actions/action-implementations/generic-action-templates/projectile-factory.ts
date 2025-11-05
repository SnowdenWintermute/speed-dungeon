import { Vector3 } from "@babylonjs/core";
import { ActionEntity, ActionEntityName } from "../../../../action-entities/index.js";
import { ActionResolutionStepContext } from "../../../../action-processing/index.js";
import { IActionUser } from "../../../../action-user-context/action-user.js";
import { Combatant } from "../../../../combatants/index.js";
import {
  CombatantBaseChildTransformNodeName,
  SceneEntityType,
} from "../../../../scene-entities/index.js";
import { SpawnableEntity, SpawnableEntityType } from "../../../../spawnables/index.js";
import {
  iterateNumericEnumKeyedRecord,
  nameToPossessive,
  throwIfError,
} from "../../../../utils/index.js";
import {
  CombatActionHitOutcomeProperties,
  CombatActionResource,
} from "../../combat-action-hit-outcome-properties.js";
import { CombatActionResourceChangeProperties } from "../../combat-action-resource-change-properties.js";
import { COMBAT_ACTIONS } from "../index.js";
import { TargetingCalculator } from "../../../targeting/targeting-calculator.js";
import { CombatantProperties } from "../../../../combatants/combatant-properties.js";

export class ProjectileFactory {
  private resourceChangeProperties: Partial<
    Record<CombatActionResource, CombatActionResourceChangeProperties>
  > = {};
  private firedByCombatantName: string;
  private startPosition: Vector3;
  private target: Combatant;
  private resourceChangeCalculators: Partial<
    Record<
      CombatActionResource,
      (
        user: IActionUser,
        hitOutcomeProperties: CombatActionHitOutcomeProperties,
        actionLevel: number,
        primaryTarget: CombatantProperties,
        actionEntityOption?: ActionEntity
      ) => null | CombatActionResourceChangeProperties
    >
  >;

  /**
   * @param options Additional configuration options
   * @property [options.defaultTargetOverride] Most projectiles can just auto calculate their target
   *           from the context, but some (like chaining split arrow) need to have
   *           their target assigned directly.
   */
  constructor(
    private context: ActionResolutionStepContext,
    options: { defaultTargetOverride?: Combatant }
  ) {
    const { actionUserContext } = context;
    const { actionUser, party } = actionUserContext;
    const { actionExecutionIntent } = context.tracker;
    const { actionName, rank } = actionExecutionIntent;
    const action = COMBAT_ACTIONS[actionName];

    this.resourceChangeCalculators = action.hitOutcomeProperties.resourceChangePropertiesGetters;

    this.firedByCombatantName = actionUser.getName();

    if (options.defaultTargetOverride !== undefined) {
      this.target = options.defaultTargetOverride;
    } else {
      const targetingCalculator = new TargetingCalculator(actionUserContext, null);
      this.target = throwIfError(
        targetingCalculator.getPrimaryTargetCombatant(party, actionExecutionIntent)
      );
    }

    const userPositionOption = actionUser.getPositionOption();
    if (userPositionOption === null) throw new Error("expected position");
    this.startPosition = userPositionOption.clone();

    for (const [resource, changePropertiesGetter] of iterateNumericEnumKeyedRecord(
      this.resourceChangeCalculators
    )) {
      const changeProperties = changePropertiesGetter(
        actionUser,
        action.hitOutcomeProperties,
        rank,
        this.target.combatantProperties
      );

      if (changeProperties === null) continue;
      this.resourceChangeProperties[resource] = changeProperties;
    }
  }

  createArrowInHand(): SpawnableEntity {
    const { actionUserContext } = this.context;
    const { actionUser } = actionUserContext;

    return {
      type: SpawnableEntityType.ActionEntity,
      actionEntity: new ActionEntity(
        {
          id: this.context.idGenerator.generate(),
          name: `${nameToPossessive(this.firedByCombatantName)} arrow`,
        },
        {
          position: this.startPosition,
          name: ActionEntityName.Arrow,
          initialRotation: new Vector3(Math.PI / 2, 0, 0),
          parentOption: {
            sceneEntityIdentifier: {
              type: SceneEntityType.CharacterModel,
              entityId: actionUser.getEntityId(),
            },
            transformNodeName: CombatantBaseChildTransformNodeName.MainHandEquipment,
          },
          actionOriginData: {
            spawnedBy: actionUser.getEntityProperties(),
            userCombatantAttributes: actionUser.getTotalAttributes(),
            resourceChangeProperties: this.resourceChangeProperties,
          },
        }
      ),
    };
  }

  createIceBoltOnHand() {
    const { actionUserContext } = this.context;
    const { actionUser } = actionUserContext;

    const actionEntity = new ActionEntity(
      {
        id: this.context.idGenerator.generate(),
        name: `${nameToPossessive(this.firedByCombatantName)} ice bolt`,
      },
      {
        position: this.startPosition,
        name: ActionEntityName.IceBolt,
        initialRotation: new Vector3(Math.PI / 2, 0, 0),
        parentOption: {
          sceneEntityIdentifier: {
            type: SceneEntityType.CharacterModel,
            entityId: actionUser.getEntityId(),
          },
          transformNodeName: CombatantBaseChildTransformNodeName.OffhandEquipment,
        },
        initialPointToward: {
          sceneEntityIdentifier: {
            type: SceneEntityType.CharacterModel,
            entityId: this.target.entityProperties.id,
          },
          transformNodeName: CombatantBaseChildTransformNodeName.HitboxCenter,
        },
        actionOriginData: {
          spawnedBy: actionUser.getEntityProperties(),
          userCombatantAttributes: actionUser.getTotalAttributes(),
          resourceChangeProperties: this.resourceChangeProperties,
        },
      }
    );

    return actionEntity;
  }
}
