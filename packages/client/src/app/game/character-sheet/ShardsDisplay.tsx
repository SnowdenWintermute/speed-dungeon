import React from "react";
import ShardsIcon from "../../../../public/img/game-ui-icons/shards.svg";

export function ShardsDisplay({
  numShards,
  extraStyles,
}: {
  extraStyles?: string;
  numShards: number;
}) {
  return (
    <div
      className={`border border-slate-400 bg-slate-700 p-2 pr-4 pl-4 hover:bg-slate-950 flex items-center ${extraStyles}`}
    >
      <span className="mr-2">{numShards}</span>{" "}
      <div className="h-5">
        <ShardsIcon className="fill-slate-400 h-full" />
      </div>
    </div>
  );
}

export function PriceDisplay({ price, extraStyles }: { price: number; extraStyles?: string }) {
  return (
    <div
      className={`w-fit flex pr-2 pl-2 h-8 items-center bg-slate-700 border border-slate-400 text-zinc-300 ${extraStyles}`}
    >
      <span className="mr-1">{price}</span>
      <ShardsIcon className="h-[20px] fill-slate-400" />
    </div>
  );
}
