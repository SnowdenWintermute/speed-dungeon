"use client";
import React from "react";
import { ParsedLadderQuery } from "../../ladder/board-page/ParsedLadderQuery";
import { ParsedRouteParam } from "../../ladder/detail-page/ParsedRouteParam";
import { profileUrlStateSchema, usernameParamSchema } from "../../ladder/query-schemas";
import { LADDER_ROUTE_PARAMS } from "../../ladder/url-params";
import { PlayerProfileView } from "../PlayerProfileView";

// two halves of one url: who the profile is about is the path, what the reader is looking at is the
// search params
export default function PlayerProfilePage() {
  return (
    <ParsedRouteParam name={LADDER_ROUTE_PARAMS.PROFILE_USERNAME} schema={usernameParamSchema}>
      {(username) => (
        <ParsedLadderQuery schema={profileUrlStateSchema}>
          {(urlState) => <PlayerProfileView username={username} urlState={urlState} />}
        </ParsedLadderQuery>
      )}
    </ParsedRouteParam>
  );
}
