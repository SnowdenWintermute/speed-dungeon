export function removeFromArray<T>(array: T[], item: T) {
  const indexToRemove = array.indexOf(item);
  if (indexToRemove !== -1) {
    array.splice(indexToRemove, 1);
  }
}
