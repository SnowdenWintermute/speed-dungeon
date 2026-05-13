import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { IconName, SVG_ICONS } from "@/app/icons";
import { useClientApplication } from "@/hooks/create-client-application-context";
import React from "react";
import ButtonBasic from "../components/atoms/ButtonBasic";

export default function DownloadDebugLogButton() {
  const clientApplication = useClientApplication();

  async function handleClick() {
    const { clientLogRecorder } = clientApplication;
    const asJson = await clientLogRecorder.exportAsJson();

    const blob = new Blob([asJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `speed-dungeon-debug-log-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  return (
    <HotkeyButton className="flex whitespace-nowrap px-1 h-full" onClick={handleClick}>
      {SVG_ICONS[IconName.DownloadDocument]("h-6 fill-slate-400")}
    </HotkeyButton>
  );
}
