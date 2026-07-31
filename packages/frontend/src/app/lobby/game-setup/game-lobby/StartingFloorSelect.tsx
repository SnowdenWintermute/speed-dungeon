import {
  BASE_SCREEN_SIZE,
  ClientIntentType,
  GOLDEN_RATIO,
  SpeedDungeonGame,
  SpeedDungeonPlayer,
} from "@speed-dungeon/common";
import React from "react";
import { SelectDropdown } from "@/app/components/atoms/SelectDropdown";
import { observer } from "mobx-react-lite";
import { useClientApplication } from "@/hooks/create-client-application-context";

export const StartingFloorSelect = observer(
  ({
    game,
    playerOption,
  }: {
    game: SpeedDungeonGame;
    playerOption: undefined | SpeedDungeonPlayer;
  }) => {
    const { lobbyClientRef } = useClientApplication();
    const menuWidth = Math.floor(BASE_SCREEN_SIZE * Math.pow(GOLDEN_RATIO, 3));

    // potential meaning the deepest floor any selected character could select vs
    // true max starting floor is the deepest that all selected have reached
    const { potentialMaxStartingFloor, maxStartingFloor } = game;

    return (
      <div style={{ width: `${menuWidth}px` }}>
        <div className="text-lg mb-2 flex justify-between">
          <span>Selected starting floor</span>
          <span>(max {maxStartingFloor})</span>
        </div>
        <SelectDropdown
          title={"starting-floor-select"}
          value={game.selectedStartingFloor}
          setValue={(value: number) => {
            lobbyClientRef.get().dispatchIntent({
              type: ClientIntentType.SelectProgressionGameStartingFloor,
              data: { floorNumber: value },
            });
          }}
          options={Array.from({ length: potentialMaxStartingFloor }, (_, index) => ({
            title: `Floor ${index + 1}`,
            value: index + 1,
            disabled: index + 1 > maxStartingFloor,
          }))}
          disabled={!playerOption?.partyName}
        />
      </div>
    );
  }
);
