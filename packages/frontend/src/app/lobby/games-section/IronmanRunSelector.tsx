import { SelectDropdown } from "@/app/components/atoms/SelectDropdown";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { observer } from "mobx-react-lite";
import React from "react";

export const IronmanRunSelector = observer(() => {
  const clientApplication = useClientApplication();
  const { lobbyContext } = clientApplication;

  return (
    <div>
      <SelectDropdown
        title={"Select saved Ironman run"}
        value={lobbyContext.selectedSavedIronmanRun}
        setValue={function (value: any): void {
          lobbyContext.selectedSavedIronmanRun = value;
        }}
        options={[...lobbyContext.savedIronmanRuns.values()].map((value) => {
          return { title: value.game.name + " " + value.savedAt, value: value.game.id };
        })}
        disabled={undefined}
      ></SelectDropdown>
    </div>
  );
});
