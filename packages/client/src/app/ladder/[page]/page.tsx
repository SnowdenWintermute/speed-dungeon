import React, { Suspense } from "react";
import Ladder from "./ladder";
import TopBar from "@/app/lobby/TopBar";

export default function LadderPage({ params }: { params: { page: string } }) {
  return (
    <div className="flex flex-col h-screen w-screen">
      <TopBar />
      <div className="flex-grow">
        <Suspense fallback={<div>Loading</div>}>
          <Ladder params={params} />
        </Suspense>
      </div>
    </div>
  );
}
