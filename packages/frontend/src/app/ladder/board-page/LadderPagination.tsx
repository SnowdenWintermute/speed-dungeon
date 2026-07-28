"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LadderPage } from "@speed-dungeon/common";
import ButtonBasic from "@/app/components/atoms/ButtonBasic";
import NumberInput from "@/app/components/atoms/NumberInput";

// pages count from zero in a query and from one everywhere a reader sees them, so the conversion
// happens here and nowhere else
export function LadderPagination<TEntry>({
  ladderPage,
  hrefForPage,
}: {
  ladderPage: LadderPage<TEntry>;
  hrefForPage: (page: number) => string;
}) {
  const router = useRouter();
  const [pageNumberText, setPageNumberText] = useState(`${ladderPage.page + 1}`);

  // the url is the source of truth: a page reached by prev/next, or by the back button, has to show
  // in the input as well
  useEffect(() => {
    setPageNumberText(`${ladderPage.page + 1}`);
  }, [ladderPage.page]);

  const { page, totalPages } = ladderPage;

  if (totalPages === 0) {
    return null;
  }

  function goToPage(pageToShow: number) {
    router.push(hrefForPage(pageToShow));
  }

  function commitPageNumberText() {
    const pageNumber = parseInt(pageNumberText);
    // an emptied input reverts rather than navigating: it is mid-edit, not a request for page NaN
    if (isNaN(pageNumber)) {
      setPageNumberText(`${page + 1}`);
      return;
    }
    goToPage(pageNumber - 1);
  }

  return (
    <div className="w-full mt-4 flex items-center">
      <ButtonBasic disabled={page === 0} onClick={() => goToPage(page - 1)} extraStyles="mr-2">
        Previous
      </ButtonBasic>
      <ButtonBasic
        disabled={page >= totalPages - 1}
        onClick={() => goToPage(page + 1)}
        extraStyles="mr-4"
      >
        Next
      </ButtonBasic>
      <label className="flex items-center" htmlFor="page number">
        <span className="mr-2">Page</span>
        <NumberInput
          name="page number"
          className="h-10 w-20 p-1 bg-slate-700 border border-slate-400 pointer-events-auto"
          value={pageNumberText}
          onChange={setPageNumberText}
          onEnter={commitPageNumberText}
          onBlur={commitPageNumberText}
          min={1}
          max={totalPages}
        />
        <span className="ml-2">{`of ${totalPages}`}</span>
      </label>
    </div>
  );
}
