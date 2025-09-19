import { CosmeticEffectNames } from "../../../../action-entities/cosmetic-effect.js";
import { ActivatedTriggersGameUpdateCommand } from "../../../../action-processing/game-update-commands.js";
import {
  ActionEntityBaseChildTransformNodeName,
  SceneEntityType,
} from "../../../../scene-entities/index.js";
import { CleanupMode } from "../../../../types.js";
import {
  CombatActionCombatLogProperties,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
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
import { INCINERATE_PROJECTILE_STEPS_CONFIG } from "./incinerate-projectile-steps-config.js";

const targetingProperties = createTargetingPropertiesConfig(
  TARGETING_PROPERTIES_TEMPLATE_GETTERS.SELF_ANY_TIME,
  { executionPreconditions: [] }
);

const config: CombatActionComponentConfig = {
  description: "Removes projectile from play",
  targetingProperties,
  combatLogMessageProperties: new CombatActionCombatLogProperties({
    ...createGenericSpellCastMessageProperties(CombatActionName.IncinerateProjectile),
    getOnUseMessage: (data) => `The firewall incinerates ${data.nameOfActionUser}`,
  }),

  hitOutcomeProperties: createHitOutcomeProperties(
    HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.BENEVOLENT_CONSUMABLE,
    {
      getHitOutcomeTriggers: (context) => {
        const toReturn: Partial<ActivatedTriggersGameUpdateCommand> = {};

        const { asShimmedActionEntity } = context.combatantContext.combatant.combatantProperties;
        if (asShimmedActionEntity === undefined)
          throw new Error("expected user to have asShimmedActionEntity");

        if (!asShimmedActionEntity.actionEntityProperties.actionOriginData)
          asShimmedActionEntity.actionEntityProperties.actionOriginData = {};

        asShimmedActionEntity.actionEntityProperties.actionOriginData.wasIncinerated = true;

        toReturn.actionEntityIdsToHide = [asShimmedActionEntity.entityProperties.id];

        toReturn.cosmeticEffectsToStart = [
          {
            name: CosmeticEffectNames.SmokePuff,
            parent: {
              sceneEntityIdentifier: {
                type: SceneEntityType.ActionEntityModel,
                entityId: asShimmedActionEntity.entityProperties.id,
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
  stepsConfig: INCINERATE_PROJECTILE_STEPS_CONFIG,
  hierarchyProperties: BASE_ACTION_HIERARCHY_PROPERTIES,
};

export const INCINERATE_PROJECTILE = new CombatActionComposite(
  CombatActionName.IncinerateProjectile,
  config
);
