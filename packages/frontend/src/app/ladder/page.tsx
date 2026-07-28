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
import { useClientApplication } from "@/hooks/create-client-application-context";
import { useLadderQuery } from "@/hooks/use-ladder-query";
import { LadderBoardSection } from "./ladder-table/LadderBoardSection";
import {
  EXPERIENCE_POINTS_LADDER_COLUMNS,
  experiencePointsLadderEntryKey,
} from "./boards/experience-points-columns";
import { CUMULATIVE_CLEAR_TIMES_COLUMNS } from "./boards/cumulative-clear-columns";
import { floorClearEntryKey } from "./boards/floor-clear-entry-key";
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
    <>
      <h1 className="text-2xl mb-6">Ladder</h1>

      <LadderBoardSection
        title={`Progression Experience Points [${pluralScheme(CharacterControlScheme.Freelancer)}]`}
        // the summary's own page size is not part of the link: the full board is a page of twenty
        fullBoardHrefOption={experiencePointsBoardRoute({
          controlScheme: CharacterControlScheme.Freelancer,
          page: 0,
        })}
        columns={EXPERIENCE_POINTS_LADDER_COLUMNS}
        keyOf={experiencePointsLadderEntryKey}
        emptyMessage={NO_RANKED_CHARACTERS_MESSAGE}
        state={freelancerExperiencePoints}
      />
      <LadderBoardSection
        title={`Progression Experience Points [${pluralScheme(CharacterControlScheme.Captain)}]`}
        fullBoardHrefOption={experiencePointsBoardRoute({
          controlScheme: CharacterControlScheme.Captain,
          page: 0,
        })}
        columns={EXPERIENCE_POINTS_LADDER_COLUMNS}
        keyOf={experiencePointsLadderEntryKey}
        emptyMessage={NO_RANKED_CHARACTERS_MESSAGE}
        state={captainExperiencePoints}
      />
      <LadderBoardSection
        title={`Deepest Cumulative Time To Clear [${pluralScheme(CharacterControlScheme.Freelancer)}]`}
        fullBoardHrefOption={cumulativeClearTimesBoardRoute({
          controlScheme: CharacterControlScheme.Freelancer,
          page: 0,
        })}
        columns={CUMULATIVE_CLEAR_TIMES_COLUMNS}
        keyOf={floorClearEntryKey}
        emptyMessage={NO_FLOOR_CLEARS_MESSAGE}
        state={freelancerCumulative}
      />
      <LadderBoardSection
        title={`Deepest Cumulative Time To Clear [${pluralScheme(CharacterControlScheme.Captain)}]`}
        fullBoardHrefOption={cumulativeClearTimesBoardRoute({
          controlScheme: CharacterControlScheme.Captain,
          page: 0,
        })}
        columns={CUMULATIVE_CLEAR_TIMES_COLUMNS}
        keyOf={floorClearEntryKey}
        emptyMessage={NO_FLOOR_CLEARS_MESSAGE}
        state={captainCumulative}
      />
    </>
  );
});

function pluralScheme(controlScheme: CharacterControlScheme): string {
  return `${CHARACTER_CONTROL_SCHEME_STRINGS[controlScheme]}s`;
}

export default LadderMainPage;
