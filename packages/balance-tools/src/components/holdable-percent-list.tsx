import { Equipment } from "@speed-dungeon/common";
import { baseItemKey, HoldableAndPercent } from "../analysis-subjects/equipment-base-item-tally.ts";

export function HoldablePercentList({ holdables }: { holdables: HoldableAndPercent[] }) {
  if (holdables.length === 0) {
    return <span className="text-theme-muted">none</span>;
  }

  return (
    <ul className="max-h-32 overflow-auto">
      {holdables.map(({ baseItem, percent }) => (
        <li key={baseItemKey(baseItem)} className="whitespace-nowrap">
          {Math.floor(percent * 100)}% {Equipment.getBaseItemStringName(baseItem)}
        </li>
      ))}
    </ul>
  );
}
