"use client";
import React from "react";
import { ParsedRouteParam } from "../../detail-page/ParsedRouteParam";
import { floorClearSnapshotIdParamSchema } from "../../query-schemas";
import { LADDER_ROUTE_PARAMS } from "../../url-params";
import { CharacterSnapshotDetailView } from "../CharacterSnapshotDetailView";

export default function CharacterSnapshotPage() {
  return (
    <ParsedRouteParam
      name={LADDER_ROUTE_PARAMS.SNAPSHOT_ID}
      schema={floorClearSnapshotIdParamSchema}
    >
      {(snapshotId) => <CharacterSnapshotDetailView snapshotId={snapshotId} />}
    </ParsedRouteParam>
  );
}
