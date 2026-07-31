# balance-tools

Edit `game-data.xlsx`, then:

```
yarn workspace @speed-dungeon/balance-tools sync
```

That rewrites `packages/server/game-data/*.csv`, which is what the server reads. Don't hand-edit
those csvs. `yarn extract --force` goes the other way and rebuilds the workbook from the values
still hardcoded in common, discarding whatever the workbook holds.

Three things the sheets won't tell you:

- Affix cells are a **max tier**, not a weight. Which affix rolls is uniform among those a base item
  can roll; the number caps how good the roll gets, scaled by item level.
- In `equipment-affix-overrides`, `x` means cannot roll at all, versus a number meaning roll at that
  tier instead of the profile's.
- Damage classifications are `category[:kinetic[:element]]`, pipe-separated, with `-` standing in
  for a kinetic type an elemental source doesn't have — `Physical:Slashing|Physical:Piercing`,
  `Magical`, `Physical:Slashing:Ice`.
