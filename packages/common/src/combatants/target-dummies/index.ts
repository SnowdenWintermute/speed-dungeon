import { Vector3 } from "@babylonjs/core";
import { EntityId, EntityName, Username } from "../../aliases.js";
import { CombatantClass } from "../combatant-class/classes.js";
import { CombatantControlledBy, CombatantControllerType } from "../combatant-controllers.js";
import { CombatantProperties } from "../combatant-properties.js";
import { CombatantSpecies } from "../combatant-species.js";
import { Combatant } from "../index.js";

export const BASIC_TARGET_DUMMY = Combatant.createInitialized(
  { name: "Target Dummy" as EntityName, id: "Target Dummy Entity Id" as EntityId },
  new CombatantProperties(
    CombatantClass.Warrior,
    CombatantSpecies.Humanoid,
    null,
    new CombatantControlledBy(CombatantControllerType.Dungeon, "" as Username),
    Vector3.Zero()
  )
);
