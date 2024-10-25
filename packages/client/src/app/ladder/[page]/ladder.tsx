import { LevelLadderEntry } from "@speed-dungeon/common";
import Link from "next/link";
import React from "react";

export default async function Ladder({ params }: { params: { page: string } }) {
  // const wait = await new Promise((resolve, reject) => {
  //   setTimeout(() => resolve(true), 2000);
  // });

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_GAME_SERVER_URL}/ladders/level/${params.page}`,
    {
      method: "GET",
      headers: { "content-type": "application/json" },
    }
  );

  const data = await response.json();

  const totalNumberOfPages: number | undefined = data["totalNumberOfPages"] | 0;
  const currentPage = parseInt(params.page, 10);
  const entriesOnThisPage: LevelLadderEntry[] | undefined = data["entriesOnPage"];

  return (
    <main className="pointer-events-auto h-full w-full flex flex-col p-4">
      <div className="flex justify-center items-center h-20 mb-4">
        <h1 className="text-2xl">Highest Level Characters</h1>
      </div>
      <table className="block border-0 border-collapse mb-4">
        <tbody className="w-full block h-10">
          <tr className="flex border-b border-slate-400 font-bold">
            <LadderTableTd text={"Rank"} numCols={4} />
            <LadderTableTd text={"Name"} numCols={4} />
            <LadderTableTd text={"User"} numCols={4} />
            <LadderTableTd text={"Level"} numCols={4} />
          </tr>
        </tbody>
        <tbody className="block min-h-0 overflow-y-auto">
          {entriesOnThisPage &&
            entriesOnThisPage
              .sort((a, b) => a.rank - b.rank)
              .map((entry) => (
                <tr className="flex border-b border-slate-400" key={entry.characterId}>
                  <LadderTableTd text={entry.rank} numCols={4} />
                  <LadderTableTd text={entry.characterName} numCols={4} />
                  <LadderTableTd text={entry.owner} numCols={4} />
                  <LadderTableTd text={entry.level} numCols={4} />
                </tr>
              ))}
          {(!entriesOnThisPage || !response.ok) && (
            <tr className="" key="error">
              <td className="">
                {(data instanceof Array && data[0]?.message) || "Error fetching ladder entries"}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <section className="flex justify-center">
        {currentPage > 1 && <Link href={`/ladder/${currentPage - 1}`}>Previous Page</Link>}
        <div>
          Page {currentPage} / {totalNumberOfPages}
        </div>
        {currentPage < totalNumberOfPages && (
          <Link href={`/ladder/${currentPage + 1}`}>Next Page</Link>
        )}
      </section>
    </main>
  );
}

function LadderTableTd({ text, numCols }: { text: string | number; numCols: number }) {
  return (
    <td
      className="p-1 text-center overflow-hidden text-ellipsis whitespace-nowrap h-10"
      style={{ width: `calc(100% / ${numCols})` }}
    >
      {text}
    </td>
  );
}
