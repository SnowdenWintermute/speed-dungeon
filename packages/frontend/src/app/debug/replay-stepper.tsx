import {
  createBabylonScheduler,
  ManualTickScheduler,
} from "@/client-application/replay-execution/replay-tree-tick-schedulers";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { HotkeyButton } from "../components/atoms/HotkeyButton";
import { IconName, SVG_ICONS } from "../icons";

export const ReplayStepper = observer(() => {
  const clientApplication = useClientApplication();
  const { replayTreeScheduler, alertsService } = clientApplication;
  const [manualTickScheduler, setManualTickScheduler] = useState<ManualTickScheduler | null>(null);

  useEffect(() => {
    return () => setAuto();
  }, []);

  function setManual() {
    const manualTickScheduler = new ManualTickScheduler();
    clientApplication.setReplayManagerTickScheduler(manualTickScheduler.scheduler);
    setManualTickScheduler(manualTickScheduler);
  }

  function setAuto() {
    const gameWorldViewOption = clientApplication.gameWorldView;
    if (gameWorldViewOption === null) {
      alertsService.setAlert("no game world view");
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
      alertsService.setAlert("Replay mode set to automatic");
    } else {
      setManual();
      alertsService.setAlert("Replay mode set to manual control");
    }
  }

  function tickToNextNotZeroDurationStep() {
    if (!manualTickScheduler) {
      alertsService.setAlert("no manual tick scheduler");
      return;
    }

    if (replayTreeScheduler.current === null && !replayTreeScheduler.hasQueue) {
      alertsService.setAlert("No replay tree scheduled");
    }
    manualTickScheduler.tickToNextNonZeroDurationStep(replayTreeScheduler);
  }

  const getToggleIcon = () =>
    manualTickScheduler ? SVG_ICONS[IconName.CaretRightPlay] : SVG_ICONS[IconName.ColumnsPause];

  return (
    <div className="mx-2 px-1 flex items-center">
      <HotkeyButton onClick={toggle} className="h-6 w-10 flex items-center justify-center">
        {getToggleIcon()("fill-slate-400 h-full")}
      </HotkeyButton>
      {manualTickScheduler && (
        <div className="h-full flex items-center">
          <HotkeyButton className="ml-2 h-8" onClick={tickToNextNotZeroDurationStep}>
            {SVG_ICONS[IconName.ArrowRightToLineNext]("h-full fill-slate-400")}
          </HotkeyButton>
        </div>
      )}
    </div>
  );
});
