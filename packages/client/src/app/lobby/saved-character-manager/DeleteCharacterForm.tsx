import React, { useState } from "react";
import HotkeyButton from "../../components/atoms/HotkeyButton";
import XShape from "../../../../public/img/basic-shapes/x-shape.svg";
import { websocketConnection } from "@/singletons/websocket-connection";
import { ClientToServerEvent, Combatant } from "@speed-dungeon/common";

export default function DeleteCharacterForm({ character }: { character: Combatant }) {
  const [confirmDeletion, setConfirmDeletion] = useState(false);

  function deleteCharacter() {
    websocketConnection.emit(
      ClientToServerEvent.DeleteSavedCharacter,
      character.entityProperties.id
    );
  }

  return (
    <form className="bg-slate-700 border border-slate-400 p-2 flex flex-col pointer-events-auto">
      <div className="flex justify-between align-middle text-slate-400 mb-2">
        <span>Check the box to enable deletion</span>
        <button
          className="h-10 w-10 p-2 border border-slate-400 hover:bg-slate-950"
          type="button"
          onClick={() => {
            setConfirmDeletion(!confirmDeletion);
          }}
        >
          {confirmDeletion && <XShape className="fill-white" />}
        </button>
      </div>
      <HotkeyButton
        className={`${confirmDeletion && "bg-red-800"} h-10 w-full p-2 border border-slate-400 disabled:opacity-50`}
        onClick={deleteCharacter}
        disabled={!confirmDeletion}
      >
        {confirmDeletion && "!!! "}DELETE CHARACTER{confirmDeletion && " !!!"}
      </HotkeyButton>
    </form>
  );
}
