"use client";
import React from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/navigation";
import {
  CHARACTER_CONTROL_SCHEME_STRINGS,
  ExperiencePointsLadderQuery,
} from "@speed-dungeon/common";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { useLadderQuery } from "@/hooks/use-ladder-query";
import { LadderBoardView } from "../board-page";
import { BoardControl } from "../board-page/BoardControl";
import { ControlSchemeSelector } from "../board-page/ControlSchemeSelector";
import {
  EXPERIENCE_POINTS_LADDER_COLUMNS,
  experiencePointsLadderEntryKey,
} from "../boards/experience-points-columns";
import { experiencePointsBoardRoute } from "../routes";

export const ExperiencePointsBoard = observer(
  ({ query }: { query: ExperiencePointsLadderQuery }) => {
    const clientApplication = useClientApplication();
    const router = useRouter();
    const state = useLadderQuery(clientApplication.ladderView.experiencePointsLadder, query);

    return (
      <LadderBoardView
        title={`Progression Experience Points [${CHARACTER_CONTROL_SCHEME_STRINGS[query.controlScheme]}s]`}
        controls={
          <BoardControl label="Control Scheme">
            <ControlSchemeSelector
              value={query.controlScheme}
              // another board starts at its own beginning rather than at the page number of this one
              onChange={(controlScheme) =>
                router.push(experiencePointsBoardRoute({ ...query, controlScheme, page: 0 }))
              }
            />
          </BoardControl>
        }
        columns={EXPERIENCE_POINTS_LADDER_COLUMNS}
        keyOf={experiencePointsLadderEntryKey}
        emptyMessage="No characters ranked yet."
        state={state}
        hrefForPage={(page) => experiencePointsBoardRoute({ ...query, page })}
      />
    );
  }
);
