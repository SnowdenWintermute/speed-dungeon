"use client";
import React from "react";
import { observer } from "mobx-react-lite";
import { PlayerProfileLookupType, Username } from "@speed-dungeon/common";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { useLadderQuery } from "@/hooks/use-ladder-query";
import { LadderQueryBoundary } from "../ladder/ladder-table/LadderQueryBoundary";
import { ProfileUrlState } from "../ladder/query-schemas";
import { PlayerProfileDetails } from "./PlayerProfileDetails";

// the profile query answers a lookup rather than a maybe-profile, so "no player by that name" is a
// case of its own here rather than the missing-record branch every other record page takes: a
// username that belongs to nobody is a different thing from a player who has never played, and that
// one is a Found profile with nothing in it
export const PlayerProfileView = observer(
  ({ username, urlState }: { username: Username; urlState: ProfileUrlState }) => {
    const clientApplication = useClientApplication();
    const state = useLadderQuery(clientApplication.ladderView.playerProfile, username);

    return (
      <LadderQueryBoundary state={state}>
        {(lookup) => {
          if (lookup.type === PlayerProfileLookupType.NoSuchPlayer) {
            return <p className="text-slate-400">{`No player named ${username}.`}</p>;
          }
          return <PlayerProfileDetails profile={lookup.profile} urlState={urlState} />;
        }}
      </LadderQueryBoundary>
    );
  }
);
