import {
  ActionPayableResource,
  CombatActionCombatLogProperties,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionExecutionIntent,
  CombatActionName,
  CombatActionOrigin,
  FriendOrFoe,
} from "../../index.js";
import { CombatActionTargetType } from "../../../targeting/combat-action-targets.js";
import { EquipmentType } from "../../../../items/equipment/index.js";
import { AbilityType } from "../../../../abilities/index.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";
import {
  createHitOutcomeProperties,
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/hit-outcome-properties-templates/index.js";
import { CombatActionCostPropertiesConfig } from "../../combat-action-cost-properties.js";
import {
  COST_PROPERTIES_TEMPLATE_GETTERS,
  createCostPropertiesConfig,
} from "../generic-action-templates/cost-properties-templates/index.js";
import {
  createTargetingPropertiesConfig,
  TARGETING_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/targeting-properties-config-templates/index.js";
import { CHAINING_SPLIT_ARROW_PARENT_STEPS_CONFIG } from "./chaining-split-arrow-parent-steps-config.js";
import { SpawnableEntityType } from "../../../../spawnables/index.js";
import { AdventuringParty } from "../../../../adventuring-party/index.js";

const hitOutcomeProperties = createHitOutcomeProperties(
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.BOW_ATTACK,
  {}
);

const costPropertiesOverrides: Partial<CombatActionCostPropertiesConfig> = {
  costBases: {
    [ActionPayableResource.Mana]: { base: 1, additives: { actionLevel: 1 } },
  },
};
const costPropertiesBase = COST_PROPERTIES_TEMPLATE_GETTERS.BASIC_RANGED_MAIN_HAND_ATTACK;
const costProperties = createCostPropertiesConfig(costPropertiesBase, costPropertiesOverrides);

const targetingProperties = createTargetingPropertiesConfig(
  TARGETING_PROPERTIES_TEMPLATE_GETTERS.AREA_HOSTILE,
  {
    getRequiredEquipmentTypeOptions: () => [EquipmentType.TwoHandedRangedWeapon],
  }
);

const config: CombatActionComponentConfig = {
  description: "Fire arrows which each bounce to up to two additional targets",

  combatLogMessageProperties: new CombatActionCombatLogProperties({
    origin: CombatActionOrigin.Attack,
    getOnUseMessage: (data) => {
      return `${data.nameOfActionUser} fires a chaining split arrow.`;
    },
  }),
  prerequisiteAbilities: [
    { type: AbilityType.Action, actionName: CombatActionName.ExplodingArrowParent },
  ],
  targetingProperties,
  hitOutcomeProperties,
  costProperties,
  stepsConfig: CHAINING_SPLIT_ARROW_PARENT_STEPS_CONFIG,
  hierarchyProperties: {
    ...BASE_ACTION_HIERARCHY_PROPERTIES,

    getConcurrentSubActions(context) {
      const { actionUser, party } = context.actionUserContext;
      const battleOption = context.actionUserContext.getBattleOption();
      const entityIdsByDisposition = actionUser.getAllyAndOpponentIds(party, battleOption);

      const opponentIds = entityIdsByDisposition[FriendOrFoe.Hostile];
      const opponents = AdventuringParty.getCombatants(party, opponentIds);

      return opponents
        .filter((opponent) => opponent.combatantProperties.hitPoints > 0)
        .map((opponent, i) => {
          const expectedProjectile = context.tracker.spawnedEntities[i];
          if (expectedProjectile === undefined)
            throw new Error("expected to have spawned an arrow for each opponent");
          if (expectedProjectile.type !== SpawnableEntityType.ActionEntity)
            throw new Error("expected to have spawned an action entity");

          return {
            user: expectedProjectile.actionEntity,
            actionExecutionIntent: new CombatActionExecutionIntent(
              CombatActionName.ChainingSplitArrowProjectile,
              context.tracker.actionExecutionIntent.rank,
              {
                type: CombatActionTargetType.Single,
                targetId: opponent.entityProperties.id,
              }
            ),
          };
        });
    },
  },
};

export const CHAINING_SPLIT_ARROW_PARENT = new CombatActionComposite(
  CombatActionName.ChainingSplitArrowParent,
  config
);
