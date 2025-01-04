import Divider from "@/app/components/atoms/Divider";
import { useGameStore } from "@/stores/game-store";
import XShape from "../../../../public/img/basic-shapes/x-shape.svg";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { BUTTON_HEIGHT_SMALL } from "@/client_consts";
import HotkeyButton from "@/app/components/atoms/HotkeyButton";
import { HOTKEYS } from "@/hotkeys";
import { useUIStore } from "@/stores/ui-store";
import { ClientToServerEvent, stringIsValidNumber } from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";
import { setAlert } from "@/app/components/alerts";
import ClickOutsideHandlerWrapper from "@/app/components/atoms/ClickOutsideHandlerWrapper";

export default function DropShardsModal({ max, min }: { max: number; min: number }) {
  const mutateGameState = useGameStore().mutateState;
  const mutateUIState = useUIStore().mutateState;
  const viewingDropShardsModal = useGameStore((state) => state.viewingDropShardsModal);
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState<number>(0);
  const focusedCharacterResult = useGameStore().getFocusedCharacter();

  useEffect(() => {
    mutateUIState((state) => {
      state.hotkeysDisabled = true;
    });

    return () => {
      mutateUIState((state) => {
        state.hotkeysDisabled = false;
      });
    };
  }, []);

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (typeof e.target.value === "string" && isNaN(parseInt(e.target.value))) return;
    if (!stringIsValidNumber(e.target.value) && e.target.value !== "") {
      console.log("tried to type a non number in a number input");
    } else {
      let newValue = parseInt(e.target.value);
      if (newValue > max || newValue < min)
        return setAlert("Enter a number between zero and your total shards");
      setValue(Number(newValue));
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (value <= 0) return;
    console.log("trying to send shard drop ", value);
    if (focusedCharacterResult instanceof Error) return console.error(focusedCharacterResult);
    websocketConnection.emit(ClientToServerEvent.DropShards, {
      characterId: focusedCharacterResult.entityProperties.id,
      numShards: Number(value),
    });
    mutateGameState((state) => {
      state.viewingDropShardsModal = false;
    });
  }

  return (
    <div className="absolute bottom-0 right-0 border border-slate-400">
      <ClickOutsideHandlerWrapper
        isActive={viewingDropShardsModal}
        onClickOutside={() => {
          mutateGameState((state) => {
            state.viewingDropShardsModal = false;
          });
        }}
      >
        <div className="p-4 bg-slate-800 z-50 pointer-events-auto w-72">
          <HotkeyButton
            className="absolute top-0 right-0 p-2 border border-t-0 border-r-0 border-slate-400 cursor-pointer bg-slate-700"
            style={{ height: `${BUTTON_HEIGHT_SMALL}rem` }}
            aria-label="close drop shards modal"
            hotkeys={[HOTKEYS.MAIN_2, HOTKEYS.CANCEL]}
            alwaysEnabled={true}
            onClick={() => {
              mutateGameState((state) => {
                state.viewingDropShardsModal = false;
              });
            }}
          >
            <XShape className="h-full w-full fill-zinc-300" />
          </HotkeyButton>
          <h3 className="">Drop how many shards?</h3>
          <Divider />
          <form className="w-full flex" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              className="bg-slate-700 border border-slate-400 h-10 p-4 min-w-0 flex-1"
              type="number"
              autoFocus={true}
              placeholder="Enter a number"
              name="drop shards"
              min={min}
              max={max}
              onChange={onInputChange}
              value={value}
            />
            <button
              type="submit"
              className="bg-slate-700 h-10 pr-2 pl-2 border-l-0 border border-slate-400"
            >
              DROP
            </button>
          </form>
        </div>
      </ClickOutsideHandlerWrapper>
    </div>
  );
}
