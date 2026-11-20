import {
  BASE_STARTING_ATTRIBUTES,
  CombatantClass,
  CombatAttribute,
  DERIVED_ATTRIBUTE_RATIOS,
  invariant,
} from "@speed-dungeon/common";
import { SpeedCurve } from "../../../state/speed-curve-state.ts";
import { DESIGNED_MAX_ATTAINABLE_TO_SLOWEST_TURN_RATIO } from "../../../tuning-consts.ts";

function readCurrentSpeedScale() {
  const baseSpeed = BASE_STARTING_ATTRIBUTES[CombatantClass.Warrior][CombatAttribute.Speed];
  const agilityToSpeedRatio =
    DERIVED_ATTRIBUTE_RATIOS[CombatAttribute.Agility]?.[CombatAttribute.Speed];
  invariant(baseSpeed !== undefined, "every class starts with a base speed");
  invariant(agilityToSpeedRatio !== undefined, "agility derives speed");
  return { baseSpeed, agilityToSpeedRatio };
}

export function FitSummary({ curve }: { curve: SpeedCurve }) {
  const { fit, inputs } = curve;
  const { baseSpeed, agilityToSpeedRatio } = readCurrentSpeedScale();

  return (
    <div className="mb-2 text-sm">
      <div className="mb-1">
        agility base <span className="text-theme-emphasis">{fit.agilityBase.toFixed(2)}</span>,
        exponent <span className="text-theme-emphasis">{fit.exponent.toFixed(3)}</span>. at base
        speed {baseSpeed}, agility to speed ratio{" "}
        <span className="text-theme-emphasis">{(baseSpeed / fit.agilityBase).toFixed(3)}</span>
        <span className="text-theme-muted">
          {" "}
          (now {agilityToSpeedRatio}, an agility base of{" "}
          {(baseSpeed / agilityToSpeedRatio).toFixed(2)})
        </span>
      </div>
      <div className="text-theme-muted">
        slowest at level 1 ({inputs.slowestAgility} agi) to max attainable (
        {Math.floor(inputs.maxAttainableAgility)} agi): 1 :{" "}
        <span className="text-theme-emphasis">
          {fit.maxAttainableToSlowestTurnRatio.toFixed(2)}
        </span>{" "}
        (target 1 : {DESIGNED_MAX_ATTAINABLE_TO_SLOWEST_TURN_RATIO}, not fitted)
      </div>
    </div>
  );
}
