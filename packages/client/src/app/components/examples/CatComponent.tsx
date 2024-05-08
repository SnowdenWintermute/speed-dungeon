"use client";
import { useCatStore } from "@/stores/cat-store";
import { useShallow } from "zustand/react/shallow";

export default function CatBox() {
  // const smallCats = useCatStore((state) => state.cats.smallCats);
  // const bigCats = useCatStore((state) => state.cats.bigCats);
  // const add5Cats = () => {
  //   useCatStore.setState((state) => ({
  //     ...state,
  //     cats: {
  //       ...state.cats,
  //       smallCats: state.cats.smallCats + 5,
  //     },
  //   }));
  // };
  //
  const { smallCats, bigCats } = useCatStore(
    useShallow((state) => ({
      smallCats: state.cats.smallCats,
      bigCats: state.cats.bigCats,
    }))
  );
  const addSmall = useCatStore((state) => state.increaseSmallCats);
  const addBig = useCatStore((state) => state.increaseBigCats);
  const summary = useCatStore((state) => state.summary);
  const mutate = useCatStore((state) => state.mutateState);
  const add5Cats = () => {
    mutate((state) => {
      state.cats.smallCats += 5;
    });
  };

  return (
    <div className="border border-slate-400 bg-slate-700 p-4">
      <div className="p-4">small: {smallCats}</div>
      <button
        className="border border-slate-400 p-4 block mb-2"
        onClick={addSmall}
      >
        add small
      </button>
      <div className="p-4">big: {bigCats}</div>
      <button
        className="border border-slate-400 p-4 block mb-2"
        onClick={addBig}
      >
        add big
      </button>
      <button
        className="border border-slate-400 p-4 block mb-2"
        onClick={add5Cats}
      >
        add 5
      </button>

      <div>{summary()}</div>
      <div>{Math.random().toFixed(2)}</div>
    </div>
  );
}
