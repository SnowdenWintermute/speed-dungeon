import { NumberRange } from "../../primatives/index.js";
import { ResourceChangeSource } from "../hp-change-source-types.js";

export interface CombatActionResourceChangeProperties {
  resourceChangeSource: ResourceChangeSource;
  baseValues: NumberRange;
}
