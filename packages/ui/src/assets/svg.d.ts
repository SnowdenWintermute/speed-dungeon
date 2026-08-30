// consumers compile these with svgr, so an svg import is a react component rather than a url.
// the prefix matters: vite/client declares a bare "*.svg" as a string and next declares it as any,
// and a second bare "*.svg" here would merge with those and collide on the default export. typescript
// picks the longest matching pattern, so naming the package wins over both without touching either.
// that only holds for imports written against this specifier, so reach these through the alias
// rather than a relative path, including from inside ui itself
declare module "@speed-dungeon/ui/*.svg" {
  import { FunctionComponent, SVGProps } from "react";
  const ReactComponent: FunctionComponent<SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}
