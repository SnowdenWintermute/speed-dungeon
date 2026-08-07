import { DataTableColumn } from "@speed-dungeon/ui/atoms/DataTable/column";
import { RoomAccuracyAvailability } from "@/analysis/accuracy-availability";

function figure(value: number) {
  return <span className="">{value.toFixed(1)}</span>;
}

export const ACCURACY_AVAILABILITY_COLUMNS: DataTableColumn<RoomAccuracyAvailability>[] = [
  {
    header: "Room",
    widthPercentOption: 8,
    renderCell: (room) => `${room.floorNumber}-${room.roomNumberOnFloor}`,
  },
  {
    header: "Acc Affixes (mean)",
    renderCell: (room) => figure(room.fromAccuracyAffixes.mean),
  },
  {
    header: "Dex Affixes (mean)",
    renderCell: (room) => figure(room.fromDexterity.mean),
  },
  {
    header: "Total (mean)",
    renderCell: (room) => figure(room.fromAllLoot.mean),
  },
  {
    header: "10th Percentile",
    renderCell: (room) => figure(room.fromAllLoot.tenthPercentile),
  },
  {
    header: "Median",
    renderCell: (room) => figure(room.fromAllLoot.median),
  },
  {
    header: "90th Percentile",
    renderCell: (room) => figure(room.fromAllLoot.ninetiethPercentile),
  },
  {
    header: "Inherent",
    renderCell: (room) => figure(room.potential.asPlayed.mean),
  },
  {
    header: "Inherent+",
    renderCell: (room) => figure(room.potential.withSupportClass.mean),
  },
  {
    header: "Max Dex",
    renderCell: (room) => figure(room.potential.withMaxDexterity.mean),
  },
  {
    header: "Max Dex+",
    renderCell: (room) => figure(room.potential.withMaxDexterityAndSupportClass.mean),
  },
  {
    header: "Allocated Only",
    renderCell: (room) => figure(room.potential.fromAllocatedPoints.mean),
  },
  {
    header: "Allocated Only+",
    renderCell: (room) => figure(room.potential.fromAllocatedPointsWithSupportClass.mean),
  },
];

export function roomKey(room: RoomAccuracyAvailability) {
  return `${room.ordinal}`;
}
