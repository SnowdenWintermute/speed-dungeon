import Divider from "@/app/components/atoms/Divider";
import XShape from "../../../../public/img/basic-shapes/x-shape.svg";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { BUTTON_HEIGHT_SMALL } from "@/client_consts";
import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { HOTKEYS } from "@/hotkeys";
import { ClientToServerEvent, stringIsValidNumber } from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";
import { setAlert } from "@/app/components/alerts";
import ClickOutsideHandlerWrapper from "@/app/components/atoms/ClickOutsideHandlerWrapper";
import { AppStore } from "@/mobx-stores/app-store";
import { observer } from "mobx-react-lite";
import { DialogElementName } from "@/mobx-stores/dialogs";

export const DropShardsModal = observer(
  ({ max, min, className }: { max: number; min: number; className: string }) => {
    const { dialogStore, inputStore } = AppStore.get();
    const viewingDropShardsModal = dialogStore.isOpen(DialogElementName.DropShards);
    const inputRef = useRef<HTMLInputElement>(null);
    const [value, setValue] = useState<number>(0);

    useEffect(() => {
      inputStore.setHotkeysDisabled(true);
      return () => {
        inputStore.setHotkeysDisabled(false);
      };
    }, []);

    function onInputChange(e: ChangeEvent<HTMLInputElement>) {
      if (typeof e.target.value === "string" && isNaN(parseInt(e.target.value))) return;
      if (!stringIsValidNumber(e.target.value) && e.target.value !== "") {
        console.error("tried to type a non number in a number input");
      } else {
        let newValue = parseInt(e.target.value);
        if (newValue > max || newValue < min)
          return setAlert("Enter a number between zero and your total shards");
        setValue(Number(newValue));
      }
    }

    function handleSubmit(e?: React.FormEvent<HTMLFormElement>) {
      e?.preventDefault();
      if (value <= 0) return;
      websocketConnection.emit(ClientToServerEvent.DropShards, {
        characterId: AppStore.get().gameStore.getExpectedFocusedCharacterId(),
        numShards: Number(value),
      });
      dialogStore.close(DialogElementName.DropShards);
    }

    return (
      <div className={className}>
        <ClickOutsideHandlerWrapper
          isActive={viewingDropShardsModal}
          onClickOutside={() => {
            dialogStore.close(DialogElementName.DropShards);
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
                dialogStore.close(DialogElementName.DropShards);
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
              <HotkeyButton
                buttonType="submit"
                hotkeys={[HOTKEYS.MAIN_1]}
                alwaysEnabled={true}
                onClick={() => {
                  handleSubmit();
                }}
                className="bg-slate-700 h-10 pr-2 pl-2 border-l-0 border border-slate-400"
              >
                DROP
              </HotkeyButton>
            </form>
          </div>
        </ClickOutsideHandlerWrapper>
      </div>
    );
  }
);
