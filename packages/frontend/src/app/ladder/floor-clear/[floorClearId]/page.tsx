"use client";
import React from "react";
import { ParsedRouteParam } from "../../detail-page/ParsedRouteParam";
import { floorClearIdParamSchema } from "../../query-schemas";
import { LADDER_ROUTE_PARAMS } from "../../url-params";
import { FloorClearDetailView } from "../FloorClearDetailView";

export default function FloorClearPage() {
  return (
    <ParsedRouteParam name={LADDER_ROUTE_PARAMS.FLOOR_CLEAR_ID} schema={floorClearIdParamSchema}>
      {(floorClearId) => <FloorClearDetailView floorClearId={floorClearId} />}
    </ParsedRouteParam>
  );
}
