"use client";
import React from "react";
import { observer } from "mobx-react-lite";
import { LadderPartyFloorClearRecordId } from "@speed-dungeon/common";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { useLadderQuery } from "@/hooks/use-ladder-query";
import { LadderRecordBoundary } from "../detail-page/LadderRecordBoundary";
import { FloorClearDetails } from "./FloorClearDetails";

export const FloorClearDetailView = observer(
  ({ floorClearId }: { floorClearId: LadderPartyFloorClearRecordId }) => {
    const clientApplication = useClientApplication();
    const state = useLadderQuery(clientApplication.ladderView.floorClear, floorClearId);

    return (
      <LadderRecordBoundary state={state} missingMessage="No such floor clear.">
        {(floorClear) => <FloorClearDetails floorClear={floorClear} />}
      </LadderRecordBoundary>
    );
  }
);
