import { NumberRange } from "../../../primatives/index.js";

export function scaleRange(range: NumberRange, scalar: number, multiplier: number) {
  range.min = range.min * scalar * multiplier;
  range.max = range.max * scalar * multiplier;
}
