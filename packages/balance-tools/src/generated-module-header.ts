import { ArrayUtils } from "@speed-dungeon/common";

// no node imports: two of the emitters using this render their text in the browser, where the dev
// server writes what they produce

export interface GeneratedModuleImports {
  from: string;
  names?: string[];
  typeNames?: string[];
}

export interface GeneratedModuleHeader {
  source: string;
  regenerate: string;
  imports: GeneratedModuleImports[];
}

/**
 * Which of a candidate set a generated body actually refers to. Emitting the whole set
 * unconditionally leaves unused imports behind whenever the rows do not cover every enum — lint
 * noise in a file nobody is allowed to hand-edit.
 *
 * Takes the bindings themselves rather than their names, so a candidate list is written as
 * `{ BodyArmor, Ring }` and the compiler checks each one exists. A plain string would go on looking
 * right after the thing it names was renamed, and only break in the generated file.
 */
export function selectUsedImports(candidates: Record<string, unknown>, body: string) {
  // a whole word rather than a `Name.` member access, so a constructed one — `new NumberRange(` —
  // is caught too. over-including only leaves an unused import; under-including breaks the build
  return Object.keys(candidates)
    .filter((name) => new RegExp(`\\b${name}\\b`).test(body))
    .sort();
}

export function emitGeneratedModuleHeader({ source, regenerate, imports }: GeneratedModuleHeader) {
  return `// GENERATED FILE — do not edit by hand.
// Source: ${source}
// Regenerate: ${regenerate}
${imports.map(emitModuleImports).join("")}`;
}

function emitModuleImports({ from, names = [], typeNames = [] }: GeneratedModuleImports) {
  const values = emitNamedImport("import", names, from);
  const types = emitNamedImport("import type", typeNames, from);
  return `${values}${types}`;
}

function emitNamedImport(keyword: string, names: string[], from: string) {
  if (names.length === 0) {
    return "";
  }
  if (names.length === 1) {
    return `${keyword} { ${ArrayUtils.getExpectedAtIndex(names, 0)} } from "${from}";\n`;
  }
  return `${keyword} {\n${names.map((name) => `  ${name},`).join("\n")}\n} from "${from}";\n`;
}
