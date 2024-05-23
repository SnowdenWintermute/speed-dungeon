import { EntityProperties } from "../primatives";
import { CombatantProperties } from "./combatant-properties";

export * from "./combatant-classes";
export * from "./combatant-species";
export * from "./combatant-properties";
export * from "./abilities/";

export type CombatantDetails = {
  entityProperties: EntityProperties;
  combatantProperties: CombatantProperties;
};
