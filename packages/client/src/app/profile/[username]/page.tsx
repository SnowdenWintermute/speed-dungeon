// "use client";
import React, { Suspense } from "react";
import TopBar from "@/app/lobby/TopBar";
import LoadingSpinner from "@/app/components/atoms/LoadingSpinner";
import UserProfile from "../user-profile";

export default function ViewProfilePage({ params }: { params: { username: string } }) {
  // const [pageNumber, setPageNumber] = useState(0);
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
        <UserProfile username={params.username} pageNumber={0} />
      </Suspense>
    </div>
  );
}
