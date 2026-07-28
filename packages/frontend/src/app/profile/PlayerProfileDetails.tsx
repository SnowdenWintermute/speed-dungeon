import React from "react";
import { CharacterControlScheme, PlayerProfileView, WinLossRecord } from "@speed-dungeon/common";
import { RecordFactList } from "../ladder/detail-page/RecordFactList";
import { ProfileUrlState } from "../ladder/query-schemas";
import { ProgressionCharactersSection } from "./ProgressionCharactersSection";
import { PersonalBestsSection } from "./PersonalBestsSection";
import { GameHistorySection } from "./GameHistorySection";

export function PlayerProfileDetails({
  profile,
  urlState,
}: {
  profile: PlayerProfileView;
  urlState: ProfileUrlState;
}) {
  return (
    <div className="pb-32">
      <h1 className="text-2xl mb-4">{profile.username}</h1>
      <RecordFactList
        facts={[{ label: "Ranked Race Record", value: winLossText(profile.rankedRaceRecord) }]}
      />

      <div className="mb-10">
        <ProgressionCharactersSection
          username={profile.username}
          controlScheme={CharacterControlScheme.Freelancer}
        />
      </div>
      <div className="mb-10">
        <ProgressionCharactersSection
          username={profile.username}
          controlScheme={CharacterControlScheme.Captain}
        />
      </div>
      <div className="mb-10">
        <PersonalBestsSection profile={profile} urlState={urlState} />
      </div>
      <GameHistorySection username={profile.username} urlState={urlState} />
    </div>
  );
}

// a player who has never raced has no rate to report — zero games is not a zero percent win rate
function winLossText(record: WinLossRecord): string {
  if (record.gamesPlayed === 0) {
    return "No ranked races played";
  }
  const winRatePercent = (record.winRate * 100).toFixed(1);
  return `${record.wins}W / ${record.losses}L in ${record.gamesPlayed} (${winRatePercent}%)`;
}
