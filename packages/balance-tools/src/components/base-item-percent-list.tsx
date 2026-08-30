import { Equipment } from "@speed-dungeon/common";
import { baseItemKey, BaseItemAndPercent } from "../analysis-subjects/equipment-base-item-tally.ts";

export function BaseItemPercentList({ baseItems }: { baseItems: BaseItemAndPercent[] }) {
  if (baseItems.length === 0) {
    return <span className="text-theme-muted">none</span>;
  }

  return (
    <ul className="max-h-32 overflow-auto">
      {baseItems.map(({ baseItem, percent }) => (
        <li key={baseItemKey(baseItem)} className="whitespace-nowrap">
          {Math.floor(percent * 100)}% {Equipment.getBaseItemStringName(baseItem)}
        </li>
      ))}
    </ul>
  );
}
