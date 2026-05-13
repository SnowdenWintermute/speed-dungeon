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
  const [nextExpectedStepString, setNextExpectedStepString] = useState("");

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
      setNextExpectedStepString(
        replayTreeScheduler.current?.nextExpectedStepString || "awaiting next replay"
      );
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
    setNextExpectedStepString(replayTreeScheduler.current?.nextExpectedStepString || "none");
  }

  function tickToNextStep() {
    if (!manualTickScheduler) {
      alertsService.setAlert("no manual tick scheduler");
      return;
    }
    if (replayTreeScheduler.current === null && !replayTreeScheduler.hasQueue) {
      alertsService.setAlert("No replay tree scheduled");
    }
    manualTickScheduler.tickToNext(replayTreeScheduler);
    setNextExpectedStepString(replayTreeScheduler.current?.nextExpectedStepString || "none");
  }

  const getToggleIcon = () =>
    manualTickScheduler ? SVG_ICONS[IconName.CaretRightPlay] : SVG_ICONS[IconName.ColumnsPause];

  return (
    <div className="mx-2 px-1 flex items-center">
      <HotkeyButton onClick={toggle} className="h-6 w-10 flex items-center justify-center">
        {getToggleIcon()("fill-slate-400 h-full")}
      </HotkeyButton>
      {manualTickScheduler && (
        <div className="h-full flex items-center relative">
          <HotkeyButton className=" h-8 pr-3" onClick={tickToNextStep}>
            {SVG_ICONS[IconName.ArrowRight]("h-full fill-slate-400 ")}
            <div
              className="absolute left-1/2 -translate-x-1/2 border border-slate-400 bg-slate-700 p-2 whitespace-nowrap"
              style={{ top: `calc(100% + 6px) ` }}
            >
              {nextExpectedStepString}
            </div>
          </HotkeyButton>
          <HotkeyButton className=" h-8 " onClick={tickToNextNotZeroDurationStep}>
            {SVG_ICONS[IconName.ArrowRightToLineNext]("h-full fill-slate-400 ")}
            <div
              className="absolute left-1/2 -translate-x-1/2 border border-slate-400 bg-slate-700 p-2 whitespace-nowrap"
              style={{ top: `calc(100% + 6px) ` }}
            >
              {nextExpectedStepString}
            </div>
          </HotkeyButton>
        </div>
      )}
    </div>
  );
});
