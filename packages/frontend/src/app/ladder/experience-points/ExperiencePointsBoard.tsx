"use client";
import React from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/navigation";
import { ExperiencePointsLadderQuery } from "@speed-dungeon/common";
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
import { LADDER_EMPTY_MESSAGES, experiencePointsBoardTitle } from "../board-text";

export const ExperiencePointsBoard = observer(
  ({ query }: { query: ExperiencePointsLadderQuery }) => {
    const clientApplication = useClientApplication();
    const router = useRouter();
    const state = useLadderQuery(clientApplication.ladderView.experiencePointsLadder, query);

    return (
      <LadderBoardView
        title={experiencePointsBoardTitle(query.controlScheme)}
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
        emptyMessage={LADDER_EMPTY_MESSAGES.NO_RANKED_CHARACTERS}
        state={state}
        hrefForPage={(page) => experiencePointsBoardRoute({ ...query, page })}
      />
    );
  }
);
