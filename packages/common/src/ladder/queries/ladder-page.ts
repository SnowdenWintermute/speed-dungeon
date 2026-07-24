export interface LadderPage<T> {
  page: number;
  totalPages: number;
  entries: T[];
}
