import { NextOrPrevious } from "../primatives/index.js";

export function getNextOrPreviousNumber(
  curr: number,
  total: number,
  direction: NextOrPrevious,
  options: { minNumber: number } = { minNumber: 1 }
) {
  const min = options.minNumber;

  switch (direction) {
    case NextOrPrevious.Next:
      return curr < total ? curr + 1 : min;
    case NextOrPrevious.Previous:
      return curr > min ? curr - 1 : total;
  }
}
