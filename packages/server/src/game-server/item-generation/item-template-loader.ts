import path from "node:path";
import fs from "node:fs";
import { parse } from "csv-parse/sync";
import { GameServer } from "..";
import { EquipmentType } from "@speed-dungeon/common";

export const EQUIPMENT_EXAMPLE_TEMPLATES = {
  [EquipmentType.Shield]: {
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
  },
};

export type EquipmentTemplate = {
  baseItem: string;
  minLevel: number;
  maxLevel: number;
  durability: number;
};

const shieldExample = EQUIPMENT_EXAMPLE_TEMPLATES[EquipmentType.Shield];
export type ShieldTemplate = typeof shieldExample;

function asEquipmentTemplate<TemplateType extends EquipmentTemplate>(
  obj: any,
  exampleTemplate: TemplateType
): Error | TemplateType {
  for (const [key, value] of Object.entries(exampleTemplate)) {
    if (typeof obj[key] !== typeof value) return new Error("Malformed template");
  }
  return obj as TemplateType;
}

export function loadItemGenerationTemplate<TemplateType extends EquipmentTemplate>(
  this: GameServer,
  filePath: string,
  exampleTemplate: TemplateType
): Error | { [baseItem: string]: TemplateType } {
  const templatesFile = fs.readFileSync(path.resolve(__dirname, filePath));
  const parsed = parse(templatesFile, {
    columns: true,
    skip_empty_lines: true,
    cast: (value, _context) => {
      const asInt = parseInt(value);
      if (value === "") return 0;
      if (!isNaN(asInt)) return asInt;
      else return value;
    },
  });

  const templates: { [baseItemName: string]: TemplateType } = {};
  //
  let i = 0;
  for (const row of parsed) {
    const templateResult = asEquipmentTemplate<TemplateType>(row, exampleTemplate);
    if (templateResult instanceof Error) return templateResult;
    templates[templateResult.baseItem] = templateResult;
    i += 1;
  }

  return templates;
}

export const SHIELD_BASE_ITEM_AFFIX_OVERRIDES = {
  //
};
