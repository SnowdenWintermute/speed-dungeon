import React from "react";
import LoadingSpinner from "../components/atoms/LoadingSpinner";

// the same instant loading state the ladder pages have: without a boundary in the segment that
// changes, a navigation leaves the previous page on screen until the next one is ready
export default function ProfileLoading() {
  return (
    <div className="h-10 w-10">
      <LoadingSpinner />
    </div>
  );
}
