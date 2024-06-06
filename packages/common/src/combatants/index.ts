import { EntityProperties } from "../primatives";
import { CombatantProperties } from "./combatant-properties";

export * from "./combatant-classes";
export * from "./combatant-species";
export * from "./combatant-properties";
export * from "./combatant-traits";
export * from "./combat-attributes";
export * from "./abilities/";
export * from "./get-combat-action-properties";

export type CombatantDetails = {
  entityProperties: EntityProperties;
  combatantProperties: CombatantProperties;
};
