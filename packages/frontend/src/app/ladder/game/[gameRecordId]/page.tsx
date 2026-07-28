"use client";
import React from "react";
import { ParsedRouteParam } from "../../detail-page/ParsedRouteParam";
import { gameRecordIdParamSchema } from "../../query-schemas";
import { LADDER_ROUTE_PARAMS } from "../../url-params";
import { GameRecordDetailView } from "../GameRecordDetailView";

export default function GameRecordPage() {
  return (
    <ParsedRouteParam name={LADDER_ROUTE_PARAMS.GAME_RECORD_ID} schema={gameRecordIdParamSchema}>
      {(gameRecordId) => <GameRecordDetailView gameRecordId={gameRecordId} />}
    </ParsedRouteParam>
  );
}
