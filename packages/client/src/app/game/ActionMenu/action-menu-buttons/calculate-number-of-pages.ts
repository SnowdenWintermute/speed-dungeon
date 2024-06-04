export default function calculateNumberOfPages(pageSize: number, numberOfItems: number): number {
  const fullPages = Math.floor(numberOfItems / pageSize);
  const remainingItems = numberOfItems % pageSize;

  if (remainingItems > 0) return fullPages + 1;
  else return fullPages;
}
