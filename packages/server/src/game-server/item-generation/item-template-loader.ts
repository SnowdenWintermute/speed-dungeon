import path from "node:path";
import fs from "node:fs";
import { parse } from "csv-parse/sync";

const shieldTemplate = {
  baseItem: "",
  minLevel: 0,
  maxLevel: 0,
  size: 0,
  minAc: 0,
  maxAc: 0,
  durability: 0,
  str: 0,
  dex: 0,
  int: 0,
  res: 0,
  agi: 0,
};

export type ShieldTemplate = typeof shieldTemplate;

export function loadItemGenerationTemplates() {
  const shields = fs.readFileSync(path.resolve(__dirname, "../../../shields.csv"));
  const parsed = parse(shields, {
    columns: true,
    skip_empty_lines: true,
    cast: (value, _context) => {
      const asInt = parseInt(value);
      if (value === "") return 0;
      if (!isNaN(asInt)) return asInt;
      else return value;
    },
  });
  console.log(parsed);
  const shieldBaseItemsEnumObject: { [name: string]: number } = {};
  const shieldTemplates: { [baseItem: number]: ShieldTemplate } = {};

  let i = 0;
  for (const row of parsed) {
    const templateResult = asShieldTemplate(row);
    if (templateResult instanceof Error) return templateResult;
    shieldBaseItemsEnumObject[templateResult.baseItem] = i;
    shieldTemplates[i] = templateResult;
    i += 1;
  }

  console.log(shieldBaseItemsEnumObject);
  console.log(shieldTemplates);
}

function isShieldTemplate(obj: any): boolean {
  for (const [key, value] of Object.entries(shieldTemplate)) {
    if (typeof obj[key] !== typeof value) return false;
  }

  return true;
}

function asShieldTemplate(obj: any): Error | ShieldTemplate {
  if (!isShieldTemplate(obj)) return new Error("invalid template provided");
  return obj as ShieldTemplate;
}
