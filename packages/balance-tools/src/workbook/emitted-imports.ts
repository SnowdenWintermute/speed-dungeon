// no node imports: one of the emitters using this runs in the browser

/**
 * Which of a candidate set a generated body actually refers to. An emitter that writes the whole set
 * unconditionally leaves unused imports behind whenever its rows do not cover every enum — lint
 * noise in a file nobody is allowed to hand-edit.
 *
 * Takes the bindings themselves rather than their names, so a candidate list is written as
 * `{ BodyArmor, Ring }` and the compiler checks each one exists. A plain string would go on looking
 * right after the thing it names was renamed, and only break in the generated file.
 */
export function selectUsedImports(candidates: Record<string, unknown>, body: string) {
  // a whole word rather than a `Name.` member access, so a constructed one — `new NumberRange(` —
  // is caught too. over-including only leaves an unused import; under-including breaks the build
  return Object.keys(candidates).filter((name) => new RegExp(`\\b${name}\\b`).test(body));
}

/** nothing referenced means no import statement at all, rather than an empty pair of braces */
export function emitImportList(names: string[], from: string) {
  if (names.length === 0) {
    return "";
  }
  return `import {\n${names.map((name) => `  ${name},`).join("\n")}\n} from "${from}";\n`;
}
