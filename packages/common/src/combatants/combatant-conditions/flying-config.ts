import { Vector3 } from "@babylonjs/core";
import { CombatActionIntent } from "../../combat/combat-actions/index.js";
import { TransformModifiers } from "../../scene-entities/index.js";
import { CombatantConditionConfig, CombatantConditionInit } from "./combatant-condition-config.js";
import { Meters } from "../../index.js";

const FLYING_HEIGHT: Meters = 2;

export function FLYING_CONFIG_CREATOR(init: CombatantConditionInit): CombatantConditionConfig {
  return {
    ...init,
    intent: CombatActionIntent.Benevolent,
    getDescription(): string {
      return `Unreachable by non-flying melee attackers`;
    },
    getTransformModifiers(): TransformModifiers {
      return { homePosition: new Vector3(0, FLYING_HEIGHT, 0) };
    },
  };
}
