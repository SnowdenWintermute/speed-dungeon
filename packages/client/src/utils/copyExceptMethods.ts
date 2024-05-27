export function copyPropertiesWithoutMethods<T extends Object>(
  source: T,
  target: Partial<T>
): void {
  Object.keys(source).forEach((key) => {
    const value = (source as any)[key];
    if (typeof value !== "function") {
      (target as any)[key] = value;
    }
  });
}
