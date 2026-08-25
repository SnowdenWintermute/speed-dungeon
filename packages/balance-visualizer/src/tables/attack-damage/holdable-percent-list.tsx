import { baseItemKey } from "@/analysis-subjects/equipment-base-item-tally";
import { Equipment } from "@speed-dungeon/common";
import { HoldableAndPercent } from "./row";

export function HoldablePercentList({ holdables }: { holdables: HoldableAndPercent[] }) {
  if (holdables.length === 0) {
    return <span className="text-theme-muted">none</span>;
  }

  return (
    <ul>
      {holdables.map(({ baseItem, percent }) => (
        <li key={baseItemKey(baseItem)} className="whitespace-nowrap">
          {Math.floor(percent * 100)}% {Equipment.getBaseItemStringName(baseItem)}
        </li>
      ))}
    </ul>
  );
}
