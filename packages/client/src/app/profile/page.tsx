import React, { Suspense } from "react";
import TopBar from "../lobby/TopBar";
import LoadingSpinner from "../components/atoms/LoadingSpinner";

export default function ProfilePage() {
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
        Your Profile
      </Suspense>
    </div>
  );
}
