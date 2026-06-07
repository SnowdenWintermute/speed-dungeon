import { SelectDropdown } from "@/app/components/atoms/SelectDropdown";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { GameId } from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";
import React from "react";

export const IronmanRunSelector = observer(() => {
  const clientApplication = useClientApplication();
  const { lobbyContext } = clientApplication;

  const options: { title: string; value: GameId | null }[] = [
    ...lobbyContext.savedIronmanRuns.values(),
  ].map((value) => {
    return { title: value.gameName + " " + value.savedAt, value: value.gameId };
  });

  options.push({ title: "New run", value: null });

  return (
    <div className="">
      <p>Select saved run</p>

      <SelectDropdown
        title={"Select saved Ironman run"}
        value={lobbyContext.selectedSavedIronmanRun}
        setValue={(value: any) => {
          lobbyContext.selectedSavedIronmanRun = value;
        }}
        options={options}
        disabled={undefined}
      ></SelectDropdown>
    </div>
  );
});
