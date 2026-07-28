"use client";
import React from "react";
import { observer } from "mobx-react-lite";
import { GameId } from "@speed-dungeon/common";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { useLadderQuery } from "@/hooks/use-ladder-query";
import { LadderRecordBoundary } from "../detail-page/LadderRecordBoundary";
import { GameRecordDetails } from "./GameRecordDetails";

export const GameRecordDetailView = observer(({ gameRecordId }: { gameRecordId: GameId }) => {
  const clientApplication = useClientApplication();
  const state = useLadderQuery(clientApplication.ladderView.gameRecord, gameRecordId);

  return (
    <LadderRecordBoundary state={state} missingMessage="No such game.">
      {(gameRecord) => <GameRecordDetails gameRecord={gameRecord} />}
    </LadderRecordBoundary>
  );
});
