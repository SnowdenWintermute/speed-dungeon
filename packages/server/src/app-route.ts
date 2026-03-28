export function appRoute(options: { isProduction: boolean }, ...args: string[]) {
  const { isProduction } = options;
  const baseRoute = isProduction ? "/api" : "";
  return baseRoute.concat(...args);
}
