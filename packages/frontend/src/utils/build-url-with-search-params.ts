// an undefined param is left out entirely rather than written as the string "undefined", so a route
// builder can hand over its optional fields as they are
export function buildUrlWithSearchParams(
  pathname: string,
  params: Record<string, string | number | boolean | undefined>
): string {
  const searchParams = new URLSearchParams();
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.set(name, `${value}`);
    }
  }
  return `${pathname}?${searchParams.toString()}`;
}
