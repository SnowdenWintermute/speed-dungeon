import React, { Suspense } from "react";
import Ladder from "./ladder";
import TopBar from "@/app/lobby/TopBar";
import LoadingSpinner from "@/app/components/atoms/LoadingSpinner";

export default async function LadderPage(props: { params: Promise<{ page: string }> }) {
  const params = await props.params;
  return (
    <div className="flex flex-col h-screen w-screen">
      <TopBar />
      <Suspense
        fallback={
          <div className="flex-grow w-full flex justify-center pt-10">
            <div className="h-10 w-10">
              <LoadingSpinner />
            </div>
          </div>
        }
      >
        <Ladder params={params} />
      </Suspense>
    </div>
  );
}
