import {
  createBabylonScheduler,
  ManualTickScheduler,
} from "@/client-application/replay-execution/replay-tree-tick-schedulers";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import ButtonBasic from "../components/atoms/ButtonBasic";
import { HotkeyButton } from "../components/atoms/HotkeyButton";

export const ReplayStepper = observer(() => {
  const clientApplication = useClientApplication();
  const [manualTickScheduler, setManualTickScheduler] = useState<ManualTickScheduler | null>(null);

  function setManual() {
    const manualTickScheduler = new ManualTickScheduler();
    clientApplication.setReplayManagerTickScheduler(manualTickScheduler.scheduler);
    setManualTickScheduler(manualTickScheduler);
  }

  function setAuto() {
    const gameWorldViewOption = clientApplication.gameWorldView;
    if (gameWorldViewOption === null) {
      clientApplication.alertsService.setAlert("no game world view");
      return;
    }
    clientApplication.setReplayManagerTickScheduler(
      createBabylonScheduler(gameWorldViewOption.engine, gameWorldViewOption.scene)
    );
    setManualTickScheduler(null);
  }

  function toggle() {
    if (manualTickScheduler) {
      setAuto();
    } else {
      setManual();
    }
  }

  function tickToNextReplayStepCompletion() {
    if (!manualTickScheduler) {
      clientApplication.alertsService.setAlert("no manual tick scheduler");
      return;
    }
    manualTickScheduler.tick(clientApplication.replayTreeScheduler.getMinRemainingDuration());
  }

  return (
    <div className="mx-2 px-1 border border-slate-400 flex items-center">
      <HotkeyButton onClick={toggle}>Toggle</HotkeyButton>
      {manualTickScheduler && (
        <ButtonBasic onClick={tickToNextReplayStepCompletion}>Next Step</ButtonBasic>
      )}
    </div>
  );
});
