export class SetUtils {
  static serializeShallow<T>(set: Set<T>): T[] {
    return [...set];
  }

  static deserializeShallow<T>(arr: T[]): Set<T> {
    return new Set(arr);
  }

  static addAll<T>(target: Set<T>, source: Set<T>): void {
    for (const item of source) {
      target.add(item);
    }
  }
}
