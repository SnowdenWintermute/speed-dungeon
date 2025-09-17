import { Vector3 } from "@babylonjs/core";
import { CosmeticEffectNames } from "../../../../action-entities/cosmetic-effect.js";
import { ActivatedTriggersGameUpdateCommand } from "../../../../action-processing/game-update-commands.js";
import {
  ActionEntityBaseChildTransformNodeName,
  SceneEntityType,
} from "../../../../scene-entities/index.js";
import {
  ResourceChangeSource,
  ResourceChangeSourceCategory,
} from "../../../hp-change-source-types.js";
import { MagicalElement } from "../../../magical-elements.js";
import {
  CombatActionCombatLogProperties,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  createGenericSpellCastMessageProperties,
} from "../../index.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";
import { CosmeticEffectInstructionFactory } from "../generic-action-templates/cosmetic-effect-factories/index.js";
import { COST_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/cost-properties-templates/index.js";
import {
  createHitOutcomeProperties,
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/hit-outcome-properties-templates/index.js";
import {
  createTargetingPropertiesConfig,
  TARGETING_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/targeting-properties-config-templates/index.js";
import { IGNITE_PROJECTILE_STEPS_CONFIG } from "./ignite-projectile-steps-config.js";

const targetingProperties = createTargetingPropertiesConfig(
  TARGETING_PROPERTIES_TEMPLATE_GETTERS.SELF_ANY_TIME,
  { executionPreconditions: [] }
);

const config: CombatActionComponentConfig = {
  description: "Add physical fire element to a projectile",
  targetingProperties,
  combatLogMessageProperties: new CombatActionCombatLogProperties({
    ...createGenericSpellCastMessageProperties(CombatActionName.IgniteProjectile),
    getOnUseMessage: (data) => `The firewall ignites ${data.nameOfActionUser}`,
  }),

  hitOutcomeProperties: createHitOutcomeProperties(
    HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.BENEVOLENT_CONSUMABLE,
    {
      getHitOutcomeTriggers: (context) => {
        const toReturn: Partial<ActivatedTriggersGameUpdateCommand> = {};

        // modify cloned user of projectile
        const { asShimmedActionEntity } = context.combatantContext.combatant.combatantProperties;
        if (asShimmedActionEntity === undefined)
          throw new Error("expected user to have asShimmedActionEntity");

        if (!asShimmedActionEntity.actionEntityProperties.actionOriginData)
          asShimmedActionEntity.actionEntityProperties.actionOriginData = {};

        asShimmedActionEntity.actionEntityProperties.actionOriginData.resourceChangeSource =
          new ResourceChangeSource({
            category: ResourceChangeSourceCategory.Physical,
            elementOption: MagicalElement.Fire,
          });

        console.log("context projectile", asShimmedActionEntity);

        toReturn.cosmeticEffectsToStart = [
          {
            name: CosmeticEffectNames.SmokeParticleStream,
            parent: {
              sceneEntityIdentifier: {
                type: SceneEntityType.ActionEntityModel,
                entityId: asShimmedActionEntity.entityProperties.id,
              },
              transformNodeName: ActionEntityBaseChildTransformNodeName.EntityRoot,
            },
          },
        ];

        return toReturn;
      },
    }
  ),
  costProperties: COST_PROPERTIES_TEMPLATE_GETTERS.FREE_ACTION(),
  stepsConfig: IGNITE_PROJECTILE_STEPS_CONFIG,
  hierarchyProperties: BASE_ACTION_HIERARCHY_PROPERTIES,
};

export const IGNITE_PROJECTILE = new CombatActionComposite(
  CombatActionName.IgniteProjectile,
  config
);
