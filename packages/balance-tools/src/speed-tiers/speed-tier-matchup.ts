import { computeGreatestCommonDivisor, formatOrdinal, invariant } from "@speed-dungeon/common";
import { formatTurnRatio } from "./format-turn-ratio.ts";

export class SpeedTierMatchup {
  readonly rowTurns: number;
  readonly columnTurns: number;
  /** the row's turn that starts its first back-to-back pair, null when the row is not faster */
  readonly firstDoubleTurnOption: number | null;

  constructor(rowDelay: number, columnDelay: number) {
    invariant(
      Number.isInteger(rowDelay) && Number.isInteger(columnDelay),
      "speed tier delays are whole numbers"
    );

    const divisor = computeGreatestCommonDivisor(rowDelay, columnDelay);
    this.rowTurns = columnDelay / divisor;
    this.columnTurns = rowDelay / divisor;
    this.firstDoubleTurnOption =
      rowDelay < columnDelay
        ? SpeedTierMatchup.computeFirstDoubleTurn(rowDelay, columnDelay, this.rowTurns)
        : null;
  }

  describe() {
    const { rowTurns, columnTurns, firstDoubleTurnOption } = this;
    const ratio = `${rowTurns} : ${columnTurns} (${formatTurnRatio(rowTurns / columnTurns)})`;

    if (firstDoubleTurnOption === null) {
      return ratio;
    }

    return `${ratio}, ${formatOrdinal(firstDoubleTurnOption)}–${formatOrdinal(firstDoubleTurnOption + 1)}*`;
  }

  // both start one turn in with no initiative roll, and the lower delay wins ties. a slower turn
  // tied with faster turn n lands between n and n + 1; one tied with n + 1 comes after it
  private static computeFirstDoubleTurn(
    fasterDelay: number,
    slowerDelay: number,
    cycleTurns: number
  ) {
    const countSlowerTurnsBefore = (time: number) => Math.ceil(time / slowerDelay) - 1;

    for (let turn = 1; turn <= cycleTurns; turn += 1) {
      const turnTime = turn * fasterDelay;
      if (countSlowerTurnsBefore(turnTime + fasterDelay) === countSlowerTurnsBefore(turnTime)) {
        return turn;
      }
    }

    invariant(false, "a faster tier takes back-to-back turns within one cycle");
  }
}
