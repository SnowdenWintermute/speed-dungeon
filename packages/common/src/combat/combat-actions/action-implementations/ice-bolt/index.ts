import {
  BASE_ACTION_HIERARCHY_PROPERTIES,
  CombatActionComponentConfig,
  CombatActionExecutionIntent,
  CombatActionLeaf,
  CombatActionName,
  createGenericSpellCastMessageProperties,
} from "../../index.js";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import { CosmeticEffectNames } from "../../../../action-entities/cosmetic-effect.js";
import { ICE_BOLT_PROJECTILE_HIT_OUTCOME_PROPERTIES } from "./ice-bolt-hit-outcome-properties.js";
import { CombatActionCostPropertiesConfig } from "../../combat-action-cost-properties.js";
import { AbilityType } from "../../../../abilities/index.js";
import { ACTION_STEPS_CONFIG_TEMPLATE_GETTERS } from "../generic-action-templates/step-config-templates/index.js";
import {
  COST_PROPERTIES_TEMPLATE_GETTERS,
  createCostPropertiesConfig,
} from "../generic-action-templates/cost-properties-templates/index.js";
import { TARGETING_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/targeting-properties-config-templates/index.js";
import { CosmeticEffectInstructionFactory } from "../generic-action-templates/cosmetic-effect-factories/index.js";
import { TargetingCalculator } from "../../../targeting/targeting-calculator.js";
import { ActionEntity, ActionEntityName } from "../../../../action-entities/index.js";
import { nameToPossessive } from "../../../../utils/index.js";
import { Vector3 } from "@babylonjs/core";
import {
  CombatantBaseChildTransformNodeName,
  SceneEntityType,
} from "../../../../scene-entities/index.js";
import { SpawnableEntityType } from "../../../../spawnables/index.js";

const stepsConfig = ACTION_STEPS_CONFIG_TEMPLATE_GETTERS.PROJECTILE_SPELL();

stepsConfig.steps[ActionResolutionStepType.InitialPositioning] = {
  ...stepsConfig.steps[ActionResolutionStepType.InitialPositioning],
  getCosmeticEffectsToStart: (context) => {
    return [
      CosmeticEffectInstructionFactory.createParticlesOnOffhand(
        CosmeticEffectNames.FrostParticleAccumulation,
        context
      ),
    ];
  },
};

(stepsConfig.steps[ActionResolutionStepType.OnActivationSpawnEntity] = {
  getSpawnableEntities: (context) => {
    const { actionUserContext } = context;
    const { actionExecutionIntent } = context.tracker;
    const { party, actionUser } = actionUserContext;

    const userPositionOption = actionUser.getPositionOption();
    if (userPositionOption === null) throw new Error("expected position");
    const position = userPositionOption.clone();

    const targetingCalculator = new TargetingCalculator(actionUserContext, null);

    const primaryTargetResult = targetingCalculator.getPrimaryTargetCombatant(
      party,
      actionExecutionIntent
    );
    if (primaryTargetResult instanceof Error) throw primaryTargetResult;
    const target = primaryTargetResult;

    const firedByCombatantName = actionUser.getName();

    const actionEntity = new ActionEntity(
      {
        id: context.idGenerator.generate(),
        name: `${nameToPossessive(firedByCombatantName)} ice bolt`,
      },
      {
        position,
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
            entityId: target.entityProperties.id,
          },
          transformNodeName: CombatantBaseChildTransformNodeName.HitboxCenter,
        },
        actionOriginData: {
          spawnedBy: actionUser.getEntityProperties(),
          userCombatantAttributes: actionUser.getTotalAttributes(),
        },
      }
    );

    return [
      {
        type: SpawnableEntityType.ActionEntity,
        actionEntity,
      },
    ];
  },
}),
  (stepsConfig.finalSteps[ActionResolutionStepType.FinalPositioning] = {
    ...stepsConfig.finalSteps[ActionResolutionStepType.FinalPositioning],
    getCosmeticEffectsToStop: (context) => [
      CosmeticEffectInstructionFactory.createParticlesOnOffhand(
        CosmeticEffectNames.FrostParticleAccumulation,
        context
      ),
    ],
  });

const costPropertiesOverrides: Partial<CombatActionCostPropertiesConfig> = {
  requiresCombatTurnInThisContext: () => false,
};

const costPropertiesBase = COST_PROPERTIES_TEMPLATE_GETTERS.BASIC_SPELL;
const costProperties = createCostPropertiesConfig(costPropertiesBase, costPropertiesOverrides);

const config: CombatActionComponentConfig = {
  description: "Summon an icy projectile",
  prerequisiteAbilities: [{ type: AbilityType.Action, actionName: CombatActionName.Firewall }],
  combatLogMessageProperties: createGenericSpellCastMessageProperties(
    CombatActionName.IceBoltProjectile
  ),
  targetingProperties: TARGETING_PROPERTIES_TEMPLATE_GETTERS.SINGLE_HOSTILE(),
  hitOutcomeProperties: ICE_BOLT_PROJECTILE_HIT_OUTCOME_PROPERTIES,
  costProperties,
  stepsConfig,

  hierarchyProperties: {
    ...BASE_ACTION_HIERARCHY_PROPERTIES,
    getConcurrentSubActions(context) {
      const user = context.tracker.getFirstExpectedSpawnedActionEntity().actionEntity;
      return [
        {
          user,
          actionExecutionIntent: new CombatActionExecutionIntent(
            CombatActionName.IceBoltProjectile,
            context.tracker.actionExecutionIntent.rank,
            context.tracker.actionExecutionIntent.targets
          ),
        },
      ];
    },
  },
};

export const ICE_BOLT_PARENT = new CombatActionLeaf(CombatActionName.IceBoltParent, config);
