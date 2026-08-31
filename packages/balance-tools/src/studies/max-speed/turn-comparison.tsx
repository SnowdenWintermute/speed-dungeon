interface Props {
  opponentSpeed: number;
  turnsPerOpponentTurn: number;
}

/** the speed being weighed against, and the turns this character takes for every one of its */
export function TurnComparison({ opponentSpeed, turnsPerOpponentTurn }: Props) {
  return (
    <span className="whitespace-nowrap">
      {opponentSpeed}
      <span className="text-theme-muted"> · </span>
      {Number.isFinite(turnsPerOpponentTurn) ? `x${turnsPerOpponentTurn.toFixed(2)}` : "∞"}
    </span>
  );
}
