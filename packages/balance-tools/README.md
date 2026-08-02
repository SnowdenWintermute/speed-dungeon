# balance-tools

Edit `game-data.xlsx`, then:

```
yarn workspace @speed-dungeon/balance-tools sync
```

That regenerates two modules in common, which is what the game reads:

- `src/items/item-creation/equipment-templates/game-data.generated.ts`
- `src/combatants/attributes/attribute-tables.generated.ts`

Don't hand-edit those. There is no path back either: the extract script that originally built the
workbook is gone, along with the hardcoded values it read from.

Three things the sheets won't tell you:

- Affix cells are a **max tier**, not a weight. Which affix rolls is uniform among those a base item
  can roll; the number caps how good the roll gets, scaled by item level.
- In `equipment-affix-overrides`, `x` means cannot roll at all, versus a number meaning roll at that
  tier instead of the profile's.
- Damage classifications are `category[:kinetic[:element]]`, pipe-separated, with `none` standing in
  for a kinetic type an elemental source doesn't have — `Physical:Slashing|Physical:Piercing`,
  `Magical`, `Physical:Slashing:Ice`, `Magical:none:Dark`.
