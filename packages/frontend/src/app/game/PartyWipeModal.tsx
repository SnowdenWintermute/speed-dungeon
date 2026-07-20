import React from "react";
import ButtonBasic from "../components/atoms/ButtonBasic";
import { AdventuringParty } from "@speed-dungeon/common";
import Divider from "../components/atoms/Divider";
import { ZIndexLayers } from "../z-index-layers";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { observer } from "mobx-react-lite";
import { HotkeyButtonTypes } from "@/client-application/ui/keybind-config";
import { keyValueToDisplayString } from "@/client-application/ui/keyboard-layouts";

export const PartyWipeModal = observer(({ party }: { party: AdventuringParty }) => {
  const clientApplication = useClientApplication();

  function leaveGame() {
    clientApplication.gameClientRef.get().leaveGame();
  }

  const leaveGameHotkey =
    clientApplication.uiStore.keybinds.getKeybind(HotkeyButtonTypes.LeaveGame)[0] ?? "";

  if (!party.hasWiped()) return <></>;
  return (
    <div
      id="party-wipe-modal"
      className=" border border-slate-400 bg-slate-700 p-4 pointer-events-auto text-zinc-300
          absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col"
      style={{ zIndex: ZIndexLayers.GameModal }}
    >
      <div className="text-lg">{party.name} was defeated</div>
      <span className="text-lg mb-2">
        at {new Date(party.fate?.timestamp || 0).toLocaleString()}
      </span>
      <Divider extraStyles="mb-4" />
      <ButtonBasic extraStyles="w-full bg-slate-950" onClick={leaveGame} hotkey={leaveGameHotkey}>
        Leave Game ({keyValueToDisplayString(leaveGameHotkey)})
      </ButtonBasic>
    </div>
  );
});
