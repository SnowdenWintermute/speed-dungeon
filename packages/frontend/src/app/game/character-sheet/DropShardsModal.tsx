import Divider from "@/app/components/atoms/Divider";
import XShape from "../../../../public/img/basic-shapes/x-shape.svg";
import React, { useEffect, useState } from "react";
import { BUTTON_HEIGHT_SMALL } from "@/client-consts";
import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import NumberInput from "@/app/components/atoms/NumberInput";
import { ClientIntentType } from "@speed-dungeon/common";
import { ClickOutsideHandlerWrapper } from "@/app/components/atoms/ClickOutsideHandlerWrapper";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { observer } from "mobx-react-lite";
import { DialogElementName } from "@/client-application/ui/dialogs";
import { HotkeyButtonTypes } from "@/client-application/ui/keybind-config";

export const DropShardsModal = observer(
  ({ max, min, className }: { max: number; min: number; className: string }) => {
    const clientApplication = useClientApplication();
    const { gameClientRef } = clientApplication;
    const { dialogs, inputs, keybinds } = clientApplication.uiStore;
    const viewingDropShardsModal = dialogs.isOpen(DialogElementName.DropShards);
    const [value, setValue] = useState<string>("");

    useEffect(() => {
      inputs.setHotkeysDisabled(true);
      return () => {
        inputs.setHotkeysDisabled(false);
      };
    }, []);

    const { alertsService } = clientApplication;

    function handleSubmit(e?: React.FormEvent<HTMLFormElement>) {
      e?.preventDefault();
      const shardCount = parseInt(value);
      if (isNaN(shardCount) || shardCount <= 0) {
        return;
      }

      gameClientRef.get().dispatchIntent({
        type: ClientIntentType.DropShards,
        data: {
          characterId: clientApplication.combatantFocus.requireFocusedCharacterId(),
          shardCount,
        },
      });

      dialogs.close(DialogElementName.DropShards);
    }

    return (
      <div className={className}>
        <ClickOutsideHandlerWrapper
          isActive={viewingDropShardsModal}
          onClickOutside={() => {
            dialogs.close(DialogElementName.DropShards);
          }}
        >
          <div className="p-4 bg-slate-800 z-50 pointer-events-auto w-72">
            <HotkeyButton
              className="absolute top-0 right-0 p-2 border border-t-0 border-r-0 border-slate-400 cursor-pointer bg-slate-700"
              style={{ height: `${BUTTON_HEIGHT_SMALL}rem` }}
              aria-label="close drop shards modal"
              hotkeys={keybinds.getKeybind(HotkeyButtonTypes.Cancel)}
              alwaysEnabled={true}
              onClick={() => {
                dialogs.close(DialogElementName.DropShards);
              }}
            >
              <XShape className="h-full w-full fill-zinc-300" />
            </HotkeyButton>
            <h3 className="">Drop how many shards?</h3>
            <Divider />
            <form className="w-full flex" onSubmit={handleSubmit}>
              <NumberInput
                className="bg-slate-700 border border-slate-400 h-10 p-4 min-w-0 flex-1"
                placeholder="Enter a number"
                name="drop shards"
                min={min}
                max={max}
                value={value}
                onChange={setValue}
                onRangeError={() =>
                  alertsService.setAlert("Enter a number between zero and your total shards")
                }
                autofocus={true}
              />
              <HotkeyButton
                buttonType="submit"
                hotkeys={keybinds.getKeybind(HotkeyButtonTypes.Confirm)}
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
