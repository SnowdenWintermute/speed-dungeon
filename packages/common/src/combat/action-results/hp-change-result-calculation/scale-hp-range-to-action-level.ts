import { NumberRange } from "../../../primatives";

export function scaleRangeToActionLevel(
  range: NumberRange,
  actionLevel: number,
  multiplier: number
) {
  range.min = range.min * actionLevel * multiplier;
  range.max = range.max * actionLevel * multiplier;
}
