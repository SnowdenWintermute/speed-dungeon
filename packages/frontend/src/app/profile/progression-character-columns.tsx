import React from "react";
import { EntityId, ProgressionCharacterSummaryView } from "@speed-dungeon/common";
import { LadderTableColumn } from "../ladder/ladder-table/column";
import { LadderTableCellLink } from "../ladder/ladder-table/LadderTableCellLink";
import { classProgressText, supportClassText } from "../ladder/class-progress-text";
import { NO_VALUE_TEXT } from "../ladder/display-text";
import { progressionCharacterRoute } from "../ladder/routes";

// the owner is the profile, so no column repeats it. the ranks arrive keyed beside the rows rather
// than on them, and a character absent from that map is one the ladder no longer holds — a dash
// rather than a number, which is the honest answer for a character that has left it
export function progressionCharacterColumns(
  ranksByCharacterId: Record<EntityId, number>
): LadderTableColumn<ProgressionCharacterSummaryView>[] {
  return [
    {
      header: "Rank",
      widthPercentOption: 8,
      renderCell: (character) => ranksByCharacterId[character.characterId] ?? NO_VALUE_TEXT,
    },
    {
      header: "Character",
      renderCell: (character) => (
        <LadderTableCellLink href={progressionCharacterRoute(character.characterId)}>
          {character.characterName}
        </LadderTableCellLink>
      ),
    },
    { header: "Main Class", renderCell: (character) => classProgressText(character.mainClass) },
    {
      header: "Support Class",
      renderCell: (character) => supportClassText(character.supportClassOption),
    },
    {
      header: "Experience",
      renderCell: (character) => character.totalExperiencePoints.toLocaleString(),
    },
  ];
}

export function progressionCharacterKey(character: ProgressionCharacterSummaryView): string {
  return character.characterId;
}
