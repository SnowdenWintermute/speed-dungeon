import Divider from "@/app/components/atoms/Divider";
import TextSubmit from "@/app/components/molocules/TextSubmit";
import { useGameStore } from "@/stores/game-store";
import XShape from "../../../../public/img/basic-shapes/x-shape.svg";
import React from "react";
import { BUTTON_HEIGHT_SMALL } from "@/client_consts";
import HotkeyButton from "@/app/components/atoms/HotkeyButton";
import { HOTKEYS } from "@/hotkeys";

export default function DropShardsModal({ max, min }: { max: number; min: number }) {
  const viewingDropShardsModal = useGameStore((state) => state.viewingDropShardsModal);
  const mutateGameState = useGameStore().mutateState;
  if (!viewingDropShardsModal) return <></>;

  return (
    <div className="absolute bottom-0 right-0 border border-slate-400 p-4 bg-slate-800 z-50 pointer-events-auto w-72">
      <HotkeyButton
        className="absolute top-0 right-0 p-2 border border-t-0 border-r-0 border-slate-400 cursor-pointer bg-slate-700"
        style={{ height: `${BUTTON_HEIGHT_SMALL}rem` }}
        aria-label="close drop shards modal"
        hotkeys={[HOTKEYS.MAIN_2]}
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
      <TextSubmit
        autofocus={true}
        inputStyles="bg-slate-700 border border-slate-400 h-10 p-4 min-w-0 flex-1"
        inputPlaceholder={"Enter a number..."}
        inputName={"Drop shards"}
        submitHandlerCallback={function (data: string): void {
          console.log("submat shard drop");
        }}
        buttonTitle={"DROP"}
        submitDisabled={false}
        type="number"
        max={max}
        min={min}
      />
    </div>
  );
}
