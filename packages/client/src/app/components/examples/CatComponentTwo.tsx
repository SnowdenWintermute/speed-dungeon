"use client";
import { useCatStore } from "@/stores/cat-store";

export default function CatBoxTwo() {
  const bigCats = useCatStore((state) => state.cats.bigCats);

  return (
    <div className="border border-slate-400 bg-slate-700 p-4">
      <div className="p-4">big: {bigCats}</div>
      <div>{Math.random().toFixed(2)}</div>
    </div>
  );
}
