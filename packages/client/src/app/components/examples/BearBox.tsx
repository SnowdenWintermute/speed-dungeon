"use client";
import { useBearStore } from "@/stores/bear-store";

export default function BearBox() {
  const bears = useBearStore((state) => state.bears);
  const increase = useBearStore((state) => state.increasePopulation);
  const remove = useBearStore((state) => state.removeAllBears);

  return (
    <div className="border border-slate-400 bg-slate-700 p-4">
      <div className="p-4">{bears}</div>
      <button
        className="border border-slate-400 p-4 block mb-2"
        onClick={increase}
      >
        add bear
      </button>
      <button className="border border-slate-400 p-4" onClick={remove}>
        remove all bears
      </button>
    </div>
  );
}
