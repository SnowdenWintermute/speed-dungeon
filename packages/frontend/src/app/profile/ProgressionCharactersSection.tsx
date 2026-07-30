"use client";
import React, { useMemo } from "react";
import { observer } from "mobx-react-lite";
import {
  CharacterControlScheme,
  PlayerProgressionCharactersQuery,
  Username,
  controlSchemePlural,
} from "@speed-dungeon/common";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { useLadderQuery } from "@/hooks/use-ladder-query";
import { LadderQueryBoundary } from "../ladder/ladder-table/LadderQueryBoundary";
import { LadderTable } from "../ladder/ladder-table";
import {
  progressionCharacterColumns,
  progressionCharacterKey,
} from "./progression-character-columns";

// a table per control scheme, because the two are separate ladders rather than one list filtered:
// the query, the ranks and the heading each name one of them
export const ProgressionCharactersSection = observer(
  ({ username, controlScheme }: { username: Username; controlScheme: CharacterControlScheme }) => {
    const clientApplication = useClientApplication();
    // assembled from two primitives, so it is memoized — the fetching hook keys its effect off the
    // query object's identity
    const query: PlayerProgressionCharactersQuery = useMemo(
      () => ({ username, controlScheme }),
      [username, controlScheme]
    );
    const state = useLadderQuery(clientApplication.ladderView.playerProgressionCharacters, query);

    return (
      <>
        <h2 className="text-xl mb-2">
          {`Progression Characters [${controlSchemePlural(controlScheme)}]`}
        </h2>
        <LadderQueryBoundary state={state}>
          {({ characters, ranksByCharacterId }) => (
            <LadderTable
              columns={progressionCharacterColumns(ranksByCharacterId)}
              entries={characters}
              keyOf={progressionCharacterKey}
              emptyMessage="No progression characters."
            />
          )}
        </LadderQueryBoundary>
      </>
    );
  }
);
