import { LADDER_MAX_PAGE_SIZE } from "../../app-consts.js";

export interface LadderPage<T> {
  page: number;
  totalPages: number;
  entries: T[];
}

// a query for one page of a board. the size is the query's own, not a global: the main page asks the
// same boards for their first few rows that the full view asks twenty of
export interface PagedLadderQuery {
  page: number;
  pageSizeOption?: number;
}

// one place decides what an unstated page size means, so a strategy, a projection and a rank can
// never disagree about how big a page was
export function pageSizeOf(query: PagedLadderQuery): number {
  return query.pageSizeOption ?? LADDER_MAX_PAGE_SIZE;
}
