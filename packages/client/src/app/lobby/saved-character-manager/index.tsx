import ButtonBasic from "@/app/components/atoms/ButtonBasic";
import { websocketConnection } from "@/singletons/websocket-connection";
import { ClientToServerEvent, CombatantClass } from "@speed-dungeon/common";
import React from "react";

export default function SavedCharacterManager() {
  return (
    <div className="w-[400px] flex flex-col p-8 border border-slate-400 bg-slate-700">
      <ButtonBasic
        extraStyles="mb-4"
        onClick={() => {
          websocketConnection.emit(ClientToServerEvent.GetSavedCharactersList);
        }}
      >
        GET SAVED CHARACTERS
      </ButtonBasic>
      <ButtonBasic
        onClick={() => {
          websocketConnection.emit(
            ClientToServerEvent.CreateSavedCharacter,
            "",
            CombatantClass.Mage
          );
        }}
      >
        CREATE CHARACTER
      </ButtonBasic>
    </div>
  );
}
