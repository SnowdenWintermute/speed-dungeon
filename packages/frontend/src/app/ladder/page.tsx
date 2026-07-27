"use client";
import React from "react";
import { observer } from "mobx-react-lite";
import {
  CHARACTER_CONTROL_SCHEME_STRINGS,
  CharacterControlScheme,
  CumulativeClearTimesQuery,
  ExperiencePointsLadderQuery,
  LADDER_SUMMARY_ROW_COUNT,
} from "@speed-dungeon/common";
import { SPACING_REM_LARGE, TOP_BAR_HEIGHT_REM } from "@/client-consts";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { useLadderQuery } from "@/hooks/use-ladder-query";
import WithTopBar from "../components/layouts/with-top-bar";
import { LadderBoardSection } from "./ladder-table/LadderBoardSection";
import {
  EXPERIENCE_POINTS_LADDER_COLUMNS,
  experiencePointsLadderEntryKey,
} from "./boards/experience-points-columns";
import {
  CUMULATIVE_CLEAR_TIMES_COLUMNS,
  floorClearEntryKey,
} from "./boards/cumulative-clear-columns";
import { cumulativeClearTimesBoardRoute, experiencePointsBoardRoute } from "./routes";

// module level so each query object keeps its identity across renders — the fetching hook keys off it
const FREELANCER_EXPERIENCE_POINTS_QUERY: ExperiencePointsLadderQuery = {
  controlScheme: CharacterControlScheme.Freelancer,
  page: 0,
  pageSizeOption: LADDER_SUMMARY_ROW_COUNT,
};
const CAPTAIN_EXPERIENCE_POINTS_QUERY: ExperiencePointsLadderQuery = {
  controlScheme: CharacterControlScheme.Captain,
  page: 0,
  pageSizeOption: LADDER_SUMMARY_ROW_COUNT,
};
const FREELANCER_CUMULATIVE_QUERY: CumulativeClearTimesQuery = {
  controlScheme: CharacterControlScheme.Freelancer,
  page: 0,
  pageSizeOption: LADDER_SUMMARY_ROW_COUNT,
};
const CAPTAIN_CUMULATIVE_QUERY: CumulativeClearTimesQuery = {
  controlScheme: CharacterControlScheme.Captain,
  page: 0,
  pageSizeOption: LADDER_SUMMARY_ROW_COUNT,
};

const NO_RANKED_CHARACTERS_MESSAGE = "No characters ranked yet.";
const NO_FLOOR_CLEARS_MESSAGE = "No floor clears recorded yet.";

const LadderMainPage = observer(() => {
  const clientApplication = useClientApplication();
  const { experiencePointsLadder, cumulativeClearTimes } = clientApplication.ladderView;

  const freelancerExperiencePoints = useLadderQuery(
    experiencePointsLadder,
    FREELANCER_EXPERIENCE_POINTS_QUERY
  );
  const captainExperiencePoints = useLadderQuery(
    experiencePointsLadder,
    CAPTAIN_EXPERIENCE_POINTS_QUERY
  );
  const freelancerCumulative = useLadderQuery(cumulativeClearTimes, FREELANCER_CUMULATIVE_QUERY);
  const captainCumulative = useLadderQuery(cumulativeClearTimes, CAPTAIN_CUMULATIVE_QUERY);

  return (
    <WithTopBar>
      <div
        className="w-full overflow-y-auto pointer-events-auto"
        style={{
          height: `calc(100vh - ${TOP_BAR_HEIGHT_REM}rem)`,
          padding: `${SPACING_REM_LARGE}rem`,
          paddingBottom: 0,
        }}
      >
        <div className="w-full max-w-[60rem] mx-auto pb-24">
          <h1 className="text-2xl mb-6">Ladder</h1>

          <LadderBoardSection
            title={`Progression Experience Points [${pluralScheme(CharacterControlScheme.Freelancer)}]`}
            fullBoardHrefOption={experiencePointsBoardRoute(CharacterControlScheme.Freelancer)}
            columns={EXPERIENCE_POINTS_LADDER_COLUMNS}
            keyOf={experiencePointsLadderEntryKey}
            emptyMessage={NO_RANKED_CHARACTERS_MESSAGE}
            state={freelancerExperiencePoints}
          />
          <LadderBoardSection
            title={`Progression Experience Points [${pluralScheme(CharacterControlScheme.Captain)}]`}
            fullBoardHrefOption={experiencePointsBoardRoute(CharacterControlScheme.Captain)}
            columns={EXPERIENCE_POINTS_LADDER_COLUMNS}
            keyOf={experiencePointsLadderEntryKey}
            emptyMessage={NO_RANKED_CHARACTERS_MESSAGE}
            state={captainExperiencePoints}
          />
          <LadderBoardSection
            title={`Deepest Cumulative Time To Clear [${pluralScheme(CharacterControlScheme.Freelancer)}]`}
            fullBoardHrefOption={cumulativeClearTimesBoardRoute(CharacterControlScheme.Freelancer)}
            columns={CUMULATIVE_CLEAR_TIMES_COLUMNS}
            keyOf={floorClearEntryKey}
            emptyMessage={NO_FLOOR_CLEARS_MESSAGE}
            state={freelancerCumulative}
          />
          <LadderBoardSection
            title={`Deepest Cumulative Time To Clear [${pluralScheme(CharacterControlScheme.Captain)}]`}
            fullBoardHrefOption={cumulativeClearTimesBoardRoute(CharacterControlScheme.Captain)}
            columns={CUMULATIVE_CLEAR_TIMES_COLUMNS}
            keyOf={floorClearEntryKey}
            emptyMessage={NO_FLOOR_CLEARS_MESSAGE}
            state={captainCumulative}
          />
        </div>
      </div>
    </WithTopBar>
  );
});

function pluralScheme(controlScheme: CharacterControlScheme): string {
  return `${CHARACTER_CONTROL_SCHEME_STRINGS[controlScheme]}s`;
}

export default LadderMainPage;
