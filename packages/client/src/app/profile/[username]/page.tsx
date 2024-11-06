import React, { Suspense } from "react";
import TopBar from "@/app/lobby/TopBar";
import LoadingSpinner from "@/app/components/atoms/LoadingSpinner";

export default function ViewProfilePage({ params }: { params: { username: string } }) {
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
        profile {params.username}
      </Suspense>
    </div>
  );
}
