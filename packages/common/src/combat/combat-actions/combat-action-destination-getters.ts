import { Quaternion, Vector3 } from "@babylonjs/core";
import { ActionResolutionStepContext } from "../../action-processing/index.js";
import { TargetingCalculator } from "../targeting/targeting-calculator.js";
import { CombatantProperties } from "../../combatants/index.js";
import { getLookRotationFromPositions } from "../../utils/index.js";

const meleeRange = 1.5;
const threshold = 0.01;

export function getMeleeAttackDestination(context: ActionResolutionStepContext) {
  {
    const { combatantContext, tracker } = context;
    const { actionExecutionIntent } = tracker;
    const targetingCalculator = new TargetingCalculator(combatantContext, null);
    const primaryTargetResult = targetingCalculator.getPrimaryTargetCombatant(
      combatantContext.party,
      actionExecutionIntent
    );
    if (primaryTargetResult instanceof Error) return primaryTargetResult;
    const target = primaryTargetResult;
    const user = combatantContext.combatant.combatantProperties;

    const distance = Vector3.Distance(target.combatantProperties.position, user.position);
    if (distance <= meleeRange || isNaN(distance) || Math.abs(meleeRange - distance) < threshold) {
      return { position: user.position.clone() };
    }

    const direction = target.combatantProperties.homeLocation
      .subtract(combatantContext.combatant.combatantProperties.homeLocation)
      .normalize();

    const destination = target.combatantProperties.homeLocation.subtract(
      direction.scale(meleeRange)
    );

    const destinationRotation = getLookRotationFromPositions(
      user.homeLocation,
      target.combatantProperties.homeLocation
    );

    // const destinationRotation = Quaternion.FromUnitVectorsToRef(
    //   // CombatantProperties.getForward(user),
    //   user.homeLocation,
    //   direction,
    //   new Quaternion()
    // );

    return {
      position: destination,
      rotation: destinationRotation,
    };
  }
}
