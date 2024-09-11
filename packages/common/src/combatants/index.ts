import { EntityProperties } from "../primatives";
import { CombatantProperties } from "./combatant-properties";

export * from "./combatant-class/";
export * from "./combatant-species";
export * from "./combatant-properties";
export * from "./combatant-traits";
export * from "./combat-attributes";
export * from "./abilities/";
export * from "./get-combat-action-properties";
export * from "./inventory";
export * from "./update-home-position";
export * from "./apply-experience-point-changes";

export type CombatantDetails = {
  entityProperties: EntityProperties;
  combatantProperties: CombatantProperties;
};
