import React from "react";
import { ExperiencePointsLadderViewEntry } from "@speed-dungeon/common";
import { LadderTableColumn } from "../ladder-table/column";
import { LadderTableCellLink } from "../ladder-table/LadderTableCellLink";
import { playerProfileRoute, progressionCharacterRoute } from "../routes";
import { classProgressText, supportClassText } from "../class-progress-text";

export const EXPERIENCE_POINTS_LADDER_COLUMNS: LadderTableColumn<ExperiencePointsLadderViewEntry>[] =
  [
    { header: "Rank", widthPercentOption: 8, renderCell: (entry) => entry.rank },
    {
      header: "Character",
      renderCell: (entry) => (
        <LadderTableCellLink href={progressionCharacterRoute(entry.characterId)}>
          {entry.characterName}
        </LadderTableCellLink>
      ),
    },
    {
      header: "Owner",
      renderCell: (entry) => (
        <LadderTableCellLink href={playerProfileRoute(entry.ownerUsername)}>
          {entry.ownerUsername}
        </LadderTableCellLink>
      ),
    },
    {
      header: "Main Class",
      renderCell: (entry) => classProgressText(entry.mainClass),
    },
    {
      header: "Support Class",
      renderCell: (entry) => supportClassText(entry.supportClassOption),
    },
    {
      header: "Experience",
      renderCell: (entry) => entry.totalExperiencePoints.toLocaleString(),
    },
  ];

export function experiencePointsLadderEntryKey(entry: ExperiencePointsLadderViewEntry): string {
  return entry.characterId;
}
