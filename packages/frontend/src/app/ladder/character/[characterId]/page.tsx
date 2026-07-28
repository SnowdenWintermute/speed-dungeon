"use client";
import React from "react";
import { ParsedRouteParam } from "../../detail-page/ParsedRouteParam";
import { progressionCharacterIdParamSchema } from "../../query-schemas";
import { LADDER_ROUTE_PARAMS } from "../../url-params";
import { ProgressionCharacterDetailView } from "../ProgressionCharacterDetailView";

export default function ProgressionCharacterPage() {
  return (
    <ParsedRouteParam
      name={LADDER_ROUTE_PARAMS.CHARACTER_ID}
      schema={progressionCharacterIdParamSchema}
    >
      {(characterId) => <ProgressionCharacterDetailView characterId={characterId} />}
    </ParsedRouteParam>
  );
}
