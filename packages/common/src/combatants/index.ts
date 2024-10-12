import { immerable } from "immer";
import { EntityProperties } from "../primatives/index.js";
import { CombatantProperties } from "./combatant-properties.js";
export * from "./combatant-class/index.js";
export * from "./combatant-species.js";
export * from "./combatant-properties.js";
export * from "./combatant-traits.js";
export * from "./combat-attributes.js";
export * from "./abilities/index.js";
export * from "./get-combat-action-properties.js";
export * from "./inventory.js";
export * from "./update-home-position.js";
export * from "./apply-experience-point-changes.js";

export class Combatant {
  [immerable] = true;
  constructor(
    public entityProperties: EntityProperties,
    public combatantProperties: CombatantProperties
  ) {}
}
