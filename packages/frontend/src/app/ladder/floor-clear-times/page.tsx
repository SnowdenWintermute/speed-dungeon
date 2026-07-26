"use client";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { useLadderQuery } from "@/hooks/use-ladder-query";
import { LadderQueryJson } from "../LadderQueryJson";
import { floorClearTimesQuerySchema } from "../query-schemas";

const FloorClearTimesPage = observer(() => {
  const clientApplication = useClientApplication();
  const searchParams = useSearchParams();

  const parseResult = useMemo(
    () => floorClearTimesQuerySchema.safeParse(Object.fromEntries(searchParams.entries())),
    [searchParams]
  );

  const state = useLadderQuery(
    clientApplication.ladderView.floorClearTimes,
    parseResult.success ? parseResult.data : undefined
  );

  return (
    <main className="h-full w-full overflow-auto pointer-events-auto p-4">
      <LadderQueryJson
        title="floor clear times"
        invalidQueryMessageOption={parseResult.success ? undefined : parseResult.error.message}
        state={state}
      />
    </main>
  );
});

export default FloorClearTimesPage;
