import React, { ReactNode } from "react";
import { LadderCharacterView, Username } from "@speed-dungeon/common";
import { LadderTableColumn } from "../ladder-table/column";
import { LadderTableCellLink } from "../ladder-table/LadderTableCellLink";
import { playerProfileRoute } from "../routes";
import { classProgressText, supportClassText } from "../class-progress-text";

// a character's last-known summary in its party, which is what both record pages list. only the name
// cell differs, and only because of where a snapshot link can sit: a clear is one moment, so each of
// its characters names one snapshot, while a party's characters are listed once for the whole game,
// where a character has a snapshot per clear rather than one to link to. the caller renders that
// cell and everything else is stated once
export function ladderCharacterColumns<TCharacter extends LadderCharacterView<Username>>(
  renderNameCell: (character: TCharacter) => ReactNode
): LadderTableColumn<TCharacter>[] {
  return [
    { header: "Character", renderCell: renderNameCell },
    { header: "Main Class", renderCell: (character) => classProgressText(character.mainClass) },
    {
      header: "Support Class",
      renderCell: (character) => supportClassText(character.supportClassOption),
    },
    {
      header: "Owner",
      renderCell: (character) => (
        <LadderTableCellLink href={playerProfileRoute(character.owner)}>
          {character.owner}
        </LadderTableCellLink>
      ),
    },
  ];
}

export function ladderCharacterKey(character: LadderCharacterView<Username>): string {
  return character.characterId;
}
