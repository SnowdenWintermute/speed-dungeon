import { NumberRange } from "../../primatives/index.js";
import { HpChangeSource } from "../hp-change-source-types.js";

export interface CombatActionHpChangeProperties {
  hpChangeSource: HpChangeSource;
  baseValues: NumberRange;
}
