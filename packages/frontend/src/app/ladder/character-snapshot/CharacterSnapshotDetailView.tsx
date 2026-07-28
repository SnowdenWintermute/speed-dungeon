"use client";
import React from "react";
import { observer } from "mobx-react-lite";
import { LadderCharacterFloorClearRecordId } from "@speed-dungeon/common";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { useLadderQuery } from "@/hooks/use-ladder-query";
import { LadderRecordBoundary } from "../detail-page/LadderRecordBoundary";
import { CharacterSnapshotDetails } from "./CharacterSnapshotDetails";

export const CharacterSnapshotDetailView = observer(
  ({ snapshotId }: { snapshotId: LadderCharacterFloorClearRecordId }) => {
    const clientApplication = useClientApplication();
    const state = useLadderQuery(
      clientApplication.ladderView.characterFloorClearSnapshot,
      snapshotId
    );

    return (
      <LadderRecordBoundary state={state} missingMessage="No such character snapshot.">
        {(snapshot) => <CharacterSnapshotDetails snapshot={snapshot} />}
      </LadderRecordBoundary>
    );
  }
);
