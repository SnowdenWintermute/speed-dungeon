import { ActionEntityName } from "../../../action-entities/index.js";
import {
  COMBAT_ACTION_NAME_STRINGS,
  COMBAT_ACTIONS,
  CombatActionExecutionIntent,
  CombatActionName,
  CombatActionTargetType,
} from "../../../combat/index.js";
import { ShapeType3D } from "../../../utils/shape-utils.js";
import { ActionResolutionStepContext, ActionResolutionStepType } from "../index.js";
import { TriggerEnvironmentalHazardsActionResolutionStep } from "./determine-environmental-hazard-triggers.js";
import { ARROW_TIME_TO_MOVE_ONE_METER } from "../../../app-consts.js";
import { EntityMotionActionResolutionStep } from "./entity-motion.js";
import cloneDeep from "lodash.clonedeep";
import { timeToReachBox } from "../../../utils/index.js";
import { SpawnableEntityType } from "../../../spawnables/index.js";
import { AdventuringParty } from "../../../adventuring-party/index.js";

const requiredFirewallLevelForIgnitingProjectiles = 2;

const IGNITABLE_PROJECTILE_TYPES: ActionEntityName[] = [ActionEntityName.Arrow];
function projectileTypeShouldBeIgnited(type: ActionEntityName) {
  return IGNITABLE_PROJECTILE_TYPES.includes(type);
}

export function getProjectileMovingThroughFirewallTriggeredActions(
  context: ActionResolutionStepContext,
  step: TriggerEnvironmentalHazardsActionResolutionStep
) {
  console.log(
    "GETPROJECTILEMOVINGTHROUGHFIREWALLTRIGGEREDACTIONS",
    COMBAT_ACTION_NAME_STRINGS[context.tracker.actionExecutionIntent.actionName]
  );

  if (step.type === ActionResolutionStepType.PreFinalPositioningCheckEnvironmentalHazardTriggers) {
    console.log("don't check for return motion triggers on projectile");
    return [];
  }

  let { spawnedEntityOption } = context.tracker;
  console.log("spawnedEntityOption from tracker:", spawnedEntityOption);
  if (spawnedEntityOption === null) {
    console.log("no spawned entity, checking previous tracker");
    spawnedEntityOption =
      context.tracker.getPreviousTrackerInSequenceOption()?.spawnedEntityOption || null;
    if (spawnedEntityOption === null) {
      console.log("previous tracker no spawned entity ");
      return [];
    }
  }
  if (spawnedEntityOption.type !== SpawnableEntityType.ActionEntity) return [];
  const projectileEntity = spawnedEntityOption.actionEntity;

  console.log("PROJECTILEENTITY", projectileEntity);

  if (!projectileTypeShouldBeIgnited(projectileEntity.actionEntityProperties.name)) return [];

  const { actionExecutionIntent } = context.tracker;
  const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];

  const entityPosition = projectileEntity.actionEntityProperties.position;

  const destinationsOption = EntityMotionActionResolutionStep.getDestinations(
    context,
    action,
    ActionResolutionStepType.OnActivationActionEntityMotion,
    entityPosition,
    ARROW_TIME_TO_MOVE_ONE_METER
  );

  if (!destinationsOption) return [];

  const { translationOption } = destinationsOption;
  if (!translationOption) return [];

  const { party } = context.combatantContext;

  // we only expect one firewall to exist
  const existingFirewallOption = AdventuringParty.getExistingActionEntityOfType(
    party,
    ActionEntityName.Firewall
  );

  if (existingFirewallOption === null) return [];
  if (
    existingFirewallOption.actionEntityProperties.actionOriginData?.actionLevel?.current !==
    requiredFirewallLevelForIgnitingProjectiles
  )
    return [];

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

  console.log("projectile time to reach box:", timeToReachFirewallOption);

  if (timeToReachFirewallOption === null) return [];

  const igniteProjectileIntent = new CombatActionExecutionIntent(
    CombatActionName.IgniteProjectile,
    { type: CombatActionTargetType.Single, targetId: projectileEntity.entityProperties.id },
    1
  );

  // use InitialPositioning motion, so that the delay happens before the post initial positioning
  // shouldExecute check in case some reason not to execute happens while it is delaying
  igniteProjectileIntent.setDelayForStep(
    ActionResolutionStepType.OnActivationActionEntityMotion,
    timeToReachFirewallOption
  );

  // this should be the cloned user of the projectile as set when the projectile
  // was fired. by having access to it we can modify it
  const igniteProjectileUser = context.combatantContext.combatant;
  // for the combat log
  igniteProjectileUser.entityProperties.name = projectileEntity.entityProperties.name;

  igniteProjectileUser.combatantProperties.asShimmedActionEntity = cloneDeep(projectileEntity);

  const intentWithUser = {
    user: igniteProjectileUser,
    actionExecutionIntent: igniteProjectileIntent,
  };

  return [intentWithUser];
}
