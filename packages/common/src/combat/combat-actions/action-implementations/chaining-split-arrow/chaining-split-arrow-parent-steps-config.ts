import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import { ActionResolutionStepConfig } from "../../combat-action-steps-config.js";
import { FriendOrFoe } from "../../targeting-schemes-and-categories.js";
import {
  ACTION_STEPS_CONFIG_TEMPLATE_GETTERS,
  createStepsConfig,
} from "../generic-action-templates/step-config-templates/index.js";
import { ProjectileFactory } from "../generic-action-templates/projectile-factory.js";

const base = ACTION_STEPS_CONFIG_TEMPLATE_GETTERS.BOW_SKILL;
const stepOverrides: Partial<Record<ActionResolutionStepType, ActionResolutionStepConfig>> = {};
const finalStepOverrides: Partial<Record<ActionResolutionStepType, ActionResolutionStepConfig>> =
  {};

stepOverrides[ActionResolutionStepType.PostPrepSpawnEntity] = {
  getSpawnableEntities: (context) => {
    const { actionUserContext } = context;
    const { actionUser, party } = actionUserContext;

    const battleOption = context.actionUserContext.getBattleOption();
    const entityIdsByDisposition = actionUser.getAllyAndOpponentIds(party, battleOption);

    const opponentIds = entityIdsByDisposition[FriendOrFoe.Hostile];
    const opponents = party.combatantManager.getExpectedCombatants(opponentIds);

    const projectileEntitiesToSpawn = opponents
      .filter((opponent) => !opponent.combatantProperties.isDead())
      .map((opponent) => {
        const projectileFactory = new ProjectileFactory(context, {
          defaultTargetOverride: opponent,
        });

        return projectileFactory.createArrowInHand();
      });

    return projectileEntitiesToSpawn;
  },
};

const config = createStepsConfig(base, {
  steps: stepOverrides,
  finalSteps: finalStepOverrides,
});

export const CHAINING_SPLIT_ARROW_PARENT_STEPS_CONFIG = config;
