import { ActionEntity, ActionEntityName } from "../../../action-entities/index.js";
import {
  COMBAT_ACTIONS,
  CombatActionExecutionIntent,
  CombatActionName,
  CombatActionTargetType,
} from "../../../combat/index.js";
import { ShapeType3D } from "../../../utils/shape-utils.js";
import {
  ActionIntentAndUser,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "../index.js";
import { TriggerEnvironmentalHazardsActionResolutionStep } from "./determine-environmental-hazard-triggers.js";
import { ARROW_TIME_TO_MOVE_ONE_METER } from "../../../app-consts.js";
import { EntityMotionActionResolutionStep } from "./entity-motion.js";
import cloneDeep from "lodash.clonedeep";
import { timeToReachBox } from "../../../utils/index.js";
import { SpawnableEntityType } from "../../../spawnables/index.js";
import { AdventuringParty } from "../../../adventuring-party/index.js";
import { Milliseconds } from "../../../primatives/index.js";

const requiredFirewallLevelForIgnitingProjectiles = 2;
const requiredFirewallLevelForIncineratingProjectiles = 3;

const IGNITABLE_PROJECTILE_TYPES: ActionEntityName[] = [ActionEntityName.Arrow];
function projectileTypeShouldBeIgnited(type: ActionEntityName) {
  return IGNITABLE_PROJECTILE_TYPES.includes(type);
}

const INCINERATABLE_PROJECTILE_TYPES: ActionEntityName[] = [
  ActionEntityName.Arrow,
  ActionEntityName.IceBolt,
];
function projectileTypeShouldBeIncinerated(type: ActionEntityName) {
  return INCINERATABLE_PROJECTILE_TYPES.includes(type);
}

export function getProjectileMovingThroughFirewallTriggeredActions(
  context: ActionResolutionStepContext,
  step: TriggerEnvironmentalHazardsActionResolutionStep
): ActionIntentAndUser[] {
  if (step.type === ActionResolutionStepType.PreFinalPositioningCheckEnvironmentalHazardTriggers) {
    return [];
  }

  let { spawnedEntityOption } = context.tracker;
  if (spawnedEntityOption === null) {
    spawnedEntityOption =
      context.tracker.getPreviousTrackerInSequenceOption()?.spawnedEntityOption || null;
    if (spawnedEntityOption === null) {
      return [];
    }
  }
  if (spawnedEntityOption.type !== SpawnableEntityType.ActionEntity) return [];
  const projectileEntity = spawnedEntityOption.actionEntity;

  const { actionExecutionIntent } = context.tracker;
  const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];

  const entityPosition = projectileEntity.actionEntityProperties.position;

  const destinationsOption = EntityMotionActionResolutionStep.getDestinations(
    context,
    action,
    ActionResolutionStepType.OnActivationActionEntityMotion,
    projectileEntity
  );

  if (!destinationsOption) return [];

  const { translationOption } = destinationsOption;
  if (!translationOption) return [];

  const { party } = context.actionUserContext;

  // we only expect one firewall to exist
  const existingFirewallOption = AdventuringParty.getExistingActionEntityOfType(
    party,
    ActionEntityName.Firewall
  );

  if (existingFirewallOption === null) return [];

  const firewallActionLevel =
    existingFirewallOption.actionEntityProperties.actionOriginData?.actionLevel?.current || 0;
  if (firewallActionLevel < requiredFirewallLevelForIgnitingProjectiles) return [];

  const { destination, duration } = translationOption;
  const { position: firewallPosition, dimensions: taggedDimensions } =
    existingFirewallOption.actionEntityProperties;
  if (taggedDimensions === undefined) throw new Error("expected firewall to have dimensions");
  if (taggedDimensions.type !== ShapeType3D.Box)
    throw new Error("expected firewall to be box shaped");

  const clonedDimensions = cloneDeep(taggedDimensions);
  taggedDimensions.dimensions.height = 99; // arbitrarily high value to make sure projectile gets detected in the y axis

  const movementVector = destination.subtract(entityPosition);
  const distance = movementVector.length();
  const speed = distance / duration;
  let timeToReachFirewallOption = timeToReachBox(
    entityPosition,
    destination,
    firewallPosition,
    clonedDimensions.dimensions,
    speed
  );

  if (timeToReachFirewallOption === null) return [];

  if (firewallActionLevel === requiredFirewallLevelForIgnitingProjectiles)
    return triggerIngiteProjectile(context, projectileEntity, timeToReachFirewallOption);
  if (firewallActionLevel === requiredFirewallLevelForIncineratingProjectiles)
    return triggerIncinerateProjectile(context, projectileEntity, timeToReachFirewallOption);

  console.error("should have gotten a triggered action by now");
  return [];
}

function triggerIncinerateProjectile(
  context: ActionResolutionStepContext,
  projectileEntity: ActionEntity,
  timeToReachFirewallOption: Milliseconds
) {
  if (!projectileTypeShouldBeIncinerated(projectileEntity.actionEntityProperties.name)) return [];

  context.tracker.projectileWasIncinerated = true;

  const intent = new CombatActionExecutionIntent(CombatActionName.IncinerateProjectile, 1, {
    type: CombatActionTargetType.Single,
    targetId: projectileEntity.entityProperties.id,
  });

  // use InitialPositioning motion, so that the delay happens before the post initial positioning
  // shouldExecute check in case some reason not to execute happens while it is delaying
  intent.setDelayForStep(
    ActionResolutionStepType.OnActivationActionEntityMotion,
    timeToReachFirewallOption
  );

  // Setting the user as the projectile is how we've sent the projectile
  // to the action. Looks like an anti-pattern to me
  const user = context.actionUserContext.actionUser;

  const intentWithUser = {
    user,
    actionExecutionIntent: intent,
  };

  return [intentWithUser];
}

function triggerIngiteProjectile(
  context: ActionResolutionStepContext,
  projectileEntity: ActionEntity,
  timeToReachFirewallOption: Milliseconds
) {
  if (!projectileTypeShouldBeIgnited(projectileEntity.actionEntityProperties.name)) return [];

  const igniteProjectileIntent = new CombatActionExecutionIntent(
    CombatActionName.IgniteProjectile,
    1,
    { type: CombatActionTargetType.Single, targetId: projectileEntity.entityProperties.id }
  );

  // use InitialPositioning motion, so that the delay happens before the post initial positioning
  // shouldExecute check in case some reason not to execute happens while it is delaying
  igniteProjectileIntent.setDelayForStep(
    ActionResolutionStepType.OnActivationActionEntityMotion,
    timeToReachFirewallOption
  );

  const igniteProjectileUser = context.actionUserContext.actionUser;

  const intentWithUser = {
    user: igniteProjectileUser,
    actionExecutionIntent: igniteProjectileIntent,
  };

  return [intentWithUser];
}
