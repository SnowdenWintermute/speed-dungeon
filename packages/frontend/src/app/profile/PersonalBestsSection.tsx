"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { FloorClearView, PlayerProfileView } from "@speed-dungeon/common";
import { useScrollIntoView } from "@/hooks/use-scroll-into-view";
import { BoardControl } from "../ladder/board-page/BoardControl";
import { ControlSchemeSelector } from "../ladder/board-page/ControlSchemeSelector";
import { GameModeSelector } from "../ladder/board-page/GameModeSelector";
import { LadderTable } from "../ladder/ladder-table";
import { ProfileUrlState } from "../ladder/query-schemas";
import { playerProfileStateRoute } from "../ladder/routes";
import { PERSONAL_BEST_COLUMNS, personalBestKey } from "./personal-best-columns";

const NO_CLEARS_MESSAGE = "No floor clears under this mode and control scheme.";

// a personal best is the player's best clear of one floor in one mode under one control scheme, so
// there are eight lists in here — two clocks over four facets. the selectors pick the facet, which is
// what leaves one row per floor in each table, and no column restates what a selector already says
export function PersonalBestsSection({
  profile,
  urlState,
}: {
  profile: PlayerProfileView;
  urlState: ProfileUrlState;
}) {
  const router = useRouter();
  const { ref, scrollIntoView } = useScrollIntoView<HTMLDivElement>();

  function inSelectedFacet(clears: FloorClearView[]): FloorClearView[] {
    return clears.filter(
      (clear) => clear.mode === urlState.mode && clear.controlScheme === urlState.controlScheme
    );
  }

  // the whole state travels, so choosing a facet does not send the game history back to page one —
  // they are separate things to be looking at, unlike a board's filters and its pager.
  // the two tables below change height with the facet, which moves everything under them, so the
  // section is brought back to the top of the scroller. next's own scroll handling is turned off:
  // it would fight this, and it acts on the window rather than on the column that actually scrolls
  function goTo(state: ProfileUrlState) {
    router.push(playerProfileStateRoute(profile.username, state), { scroll: false });
    scrollIntoView();
  }

  return (
    <div ref={ref}>
      <h2 className="text-xl mb-2">Personal Bests</h2>
      <div className="flex flex-wrap items-end">
        <BoardControl label="Game Mode">
          <GameModeSelector
            value={urlState.mode}
            onChange={(mode) => goTo({ ...urlState, mode })}
          />
        </BoardControl>
        <BoardControl label="Control Scheme">
          <ControlSchemeSelector
            value={urlState.controlScheme}
            onChange={(controlScheme) => goTo({ ...urlState, controlScheme })}
          />
        </BoardControl>
      </div>

      <h3 className="mb-2">Best Times On Floor</h3>
      <div className="mb-10">
        <LadderTable
          columns={PERSONAL_BEST_COLUMNS}
          entries={inSelectedFacet(profile.personalBestFloorTimes)}
          keyOf={personalBestKey}
          emptyMessage={NO_CLEARS_MESSAGE}
        />
      </div>
      <h3 className="mb-2">Best Cumulative Times To Clear Floor</h3>
      <LadderTable
        columns={PERSONAL_BEST_COLUMNS}
        entries={inSelectedFacet(profile.personalBestCumulativeTimes)}
        keyOf={personalBestKey}
        emptyMessage={NO_CLEARS_MESSAGE}
      />
    </div>
  );
}
