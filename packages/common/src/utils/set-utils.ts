export class SetUtils {
  static serializeShallow<T>(set: Set<T>): T[] {
    return [...set];
  }

  static deserializeShallow<T>(arr: T[]): Set<T> {
    return new Set(arr);
  }
}
