import { NumberRange } from "../../primatives/number-range.js";
import { ResourceChangeSource } from "../hp-change-source-types.js";

export interface CombatActionResourceChangeProperties {
  resourceChangeSource: ResourceChangeSource;
  baseValues: NumberRange;
}
