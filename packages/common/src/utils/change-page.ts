import { NextOrPrevious } from "../primatives/index.js";

export function changePage(curr: number, total: number, direction: NextOrPrevious) {
  switch (direction) {
    case NextOrPrevious.Next:
      return curr < total ? curr + 1 : 1;
    case NextOrPrevious.Previous:
      return curr > 1 ? curr - 1 : total;
  }
}
