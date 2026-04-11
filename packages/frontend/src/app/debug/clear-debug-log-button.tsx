import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { IconName, SVG_ICONS } from "@/app/icons";
import { useClientApplication } from "@/hooks/create-client-application-context";
import React, { useState } from "react";
import ButtonBasic from "../components/atoms/ButtonBasic";

export default function ClearDebugLogButton() {
  const [open, setOpen] = useState(false);
  const clientApplication = useClientApplication();

  async function handleDeleteLog() {
    const { clientLogRecorder } = clientApplication;
    await clientLogRecorder.clear();
    clientApplication.alertsService.setAlert("Cleared debug log");
    setOpen(false);
  }

  function toggleOpen() {
    setOpen(!open);
  }

  return (
    <div>
      <HotkeyButton className="flex whitespace-nowrap px-1 h-full " onClick={toggleOpen}>
        {SVG_ICONS[IconName.TrashCan]("h-6 fill-slate-400")}
      </HotkeyButton>

      <dialog open={open} className="p-2 mt-2 bg-slate-700 border border-slate-400 text-zinc-300">
        <div className="mb-2">Really delete log?</div>
        <div className="flex justify-between">
          <ButtonBasic onClick={handleDeleteLog}>YES</ButtonBasic>
          <ButtonBasic onClick={() => setOpen(false)}>NO</ButtonBasic>
        </div>
      </dialog>
    </div>
  );
}
