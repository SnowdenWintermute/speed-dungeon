"use client";
import React from "react";
import { observer } from "mobx-react-lite";
import { EntityId } from "@speed-dungeon/common";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { useLadderQuery } from "@/hooks/use-ladder-query";
import { LadderRecordBoundary } from "../detail-page/LadderRecordBoundary";
import { ProgressionCharacterDetails } from "./ProgressionCharacterDetails";

export const ProgressionCharacterDetailView = observer(
  ({ characterId }: { characterId: EntityId }) => {
    const clientApplication = useClientApplication();
    const state = useLadderQuery(clientApplication.ladderView.progressionCharacter, characterId);

    return (
      <LadderRecordBoundary state={state} missingMessage="No such character.">
        {(character) => <ProgressionCharacterDetails character={character} />}
      </LadderRecordBoundary>
    );
  }
);
