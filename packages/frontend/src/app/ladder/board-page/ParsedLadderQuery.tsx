"use client";
import React, { ReactNode, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ZodType, ZodTypeDef } from "zod";

// url text is untrusted, so a board is only rendered once its query parsed. the board below this
// takes a whole query and never a maybe-query, which is what keeps defaults out of the boards —
// what an absent param means is the schema's business
export function ParsedLadderQuery<TQuery>({
  schema,
  children,
}: {
  // unknown input: safeParse takes unknown anyway, and naming the url's own Record<string, string>
  // here would refuse every schema, whose input has optional (so possibly undefined) params
  schema: ZodType<TQuery, ZodTypeDef, unknown>;
  children: (query: TQuery) => ReactNode;
}) {
  const searchParams = useSearchParams();

  // the query object's identity is what the fetching hook keys off, so it survives re-renders that
  // did not change the url
  const parseResult = useMemo(
    () => schema.safeParse(Object.fromEntries(searchParams.entries())),
    [schema, searchParams]
  );

  if (!parseResult.success) {
    return <p className="text-red-400">{`invalid query params: ${parseResult.error.message}`}</p>;
  }

  return <>{children(parseResult.data)}</>;
}
