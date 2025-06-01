import { Vector3 } from "@babylonjs/core";
import { EntityProperties } from "../../primatives/entity-properties.js";
import { Combatant, CombatantClass, CombatantProperties, CombatantSpecies } from "../index.js";

const entityProperties: EntityProperties = { name: "test warrior", id: "test-warrior" };

const combatantProperties = new CombatantProperties(
  CombatantClass.Warrior,
  CombatantSpecies.Humanoid,
  null,
  null,
  Vector3.Zero()
);

export const TEST_WARRIOR_COMBATANT = new Combatant(entityProperties, combatantProperties);
