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
  CombatActionResource,
  createGenericSpellCastMessageProperties,
} from "../../index.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";
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

        const { actionUser } = context.actionUserContext;
        const actionEntityProperties = actionUser.getActionEntityProperties();

        if (!actionEntityProperties.actionOriginData)
          actionEntityProperties.actionOriginData = { spawnedBy: { id: "", name: "" } };

        const { actionOriginData } = actionEntityProperties;

        if (!actionOriginData.resourceChangeProperties)
          actionOriginData.resourceChangeProperties = {};

        const hpChangePropertiesOption =
          actionOriginData.resourceChangeProperties[CombatActionResource.HitPoints];

        if (hpChangePropertiesOption) {
          if (hpChangePropertiesOption)
            hpChangePropertiesOption.resourceChangeSource.elementOption = MagicalElement.Fire;
        }

        // @PERF - combine when starting multiple cosmeticEffectsToStart on same entity
        toReturn.cosmeticEffectsToStart = [
          {
            name: CosmeticEffectNames.SmokeParticleStream,
            parent: {
              sceneEntityIdentifier: {
                type: SceneEntityType.ActionEntityModel,
                entityId: actionUser.getEntityId(),
              },
              transformNodeName: ActionEntityBaseChildTransformNodeName.EntityRoot,
            },
          },
          {
            name: CosmeticEffectNames.SmokePuff,
            parent: {
              sceneEntityIdentifier: {
                type: SceneEntityType.ActionEntityModel,
                entityId: actionUser.getEntityId(),
              },
              transformNodeName: ActionEntityBaseChildTransformNodeName.EntityRoot,
            },
            unattached: true,
            lifetime: 500,
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
