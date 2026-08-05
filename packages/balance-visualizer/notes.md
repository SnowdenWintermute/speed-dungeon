# Balance Visualizer — Design Notes

Design agreed 2026-08-04/05. Nothing below is built yet; the package is still the Vite + React
scaffold with a smoke-test `App.tsx`.

The work splits in two. **Part 1** simulates gear acquisition with no combat at all — the party
magically wins every fight, takes no damage, and only ever decides what to wear. **Part 2** adds
attacks-only simulated battles on top of it. Part 1 is the whole near-term scope; Part 2 is sketched
at the bottom so its needs don't get designed out.

Dropping combat from Part 1 removes three subsystems: monster AI, the incoming-damage model, and
durability wear. Those were the least-settled parts of the design, which is why the cut is here.

---

## Part 1 — gear acquisition, no combat

Walk a party of three through the dungeon room by room. Each monster lair awards experience and
rolls loot through the real `LootGenerator`. Characters level up, allocate attributes, and re-solve
their equipment against a stated goal. Nothing fights. Run it a few hundred times with fixed seeds
and aggregate.

### Locked decisions

**Loot distribution.** Each dropped item goes to whichever character's objective improves most by
taking it, evaluated greedily in drop order. Matches the game's shared-ground model
(`equipItemFromGround`) and reuses the solver's evaluator, so there is no second notion of "good".

**One fixed target dummy for the whole run**, not per-floor palettes. Keeps room-to-room numbers
comparable and avoids re-solving per floor. The dummy needs hand-tuned accuracy and average hit size
**per floor** — see the effective-HP note below. Per-floor palettes come back in Part 2, where they
are load-bearing.

**The objective is `DPS^w × EHP^(1−w)`**, with `w` a per-character slider from pure survivability (0)
to pure DPS (1). Geometric weighting because damage and hit points are different units and any
linear exchange rate between them is arbitrary; weighting *percentages* asks "is +10% damage worth
more than +10% survivability", which has an answer. `w = 0.5` is the default and means something on
its own: up to a constant it is total damage dealt before dying.

**Effective HP requires an attacking dummy.** `getDamageAfterArmorClass` is
`2.5·d² / (ac + 2.5·d)` — the worth of AC depends on incoming hit size `d`, and Evasion means
nothing without an attacker's accuracy. So HP/AC/Evasion do not combine into a scalar from the
character sheet alone. The dummy gets a hand-tuned accuracy and average hit size per floor, and EHP
is HP divided by the expected fraction of an incoming swing that lands and penetrates. Without this
the `w = 0` end of the slider optimizes nothing.

**Speed is a multiplier on the objective, with hand-tuned per-floor constants.** `1.0` at or above
the floor's average enemy speed, sloping down to a hard penalty below half. Deriving average enemy
speed from the spawn palette is ~5 lines (weight `MONSTER_SPAWN_TABLES` entries by `roomWeight`,
read Speed at `level = floor`) but made-up constants come first and get tuned by hand.

**Discard policy: drop every dominated item; if still over capacity, randomly drop unworn items.**
`INVENTORY_DEFAULT_CAPACITY` is 20 and a run generates on the order of 200 drops across three
characters, so overflow is guaranteed and the rule changes results. Dominated-item removal is the
frontier the solver already computes, so it is free and provably lossless *for the current
objective* — an item discarded under an offense slider might have mattered under a defense one, but
the slider is fixed for a run.

**Aggregate by base item and by affix.** Each equipped item records
`{ baseItemKey, prefix, suffix }` where `baseItemKey` is `{ equipmentType, baseItemType }`. That
allows rollups by base item, by affix, or by the pair. Affix pick rates are arguably the more
actionable table since affixes are cheaper to retune than base items.

**Re-solve only when a non-dominated item arrives.** Most drops cannot change the answer, and the
run does order 10⁴ solves.

**Hotswap slots ignored.** Solve only the selected holdable set. Modelling the swap needs a reason
to swap, which needs monsters.

### Verified game facts

Checked against the source on 2026-08-04/05. Recorded so future sessions don't re-derive them.

**Levels are deterministic, not a distribution.** Monster level = floor level
(`random-dungeon-generation-policy.ts`). Rooms per floor is fixed: 4 monster lairs, plus boss,
vending machine, and staircase. `ROOM_FILL_BUDGET` of 1 against costs around 0.33 gives ~3 monsters
per room. At `BASE_XP_PER_MONSTER` 30 split three ways that is ~120 XP per floor cleared, against
100 to reach level 2 and 225 cumulative for level 3. `BASE_XP_LEVEL_DIFF_MULTIPLIER` 0.25 acts as a
governor pulling toward level ≈ floor + 1.

**Drop rates are closed-form.** Under `FALLBACK_MONSTER_REWARD_PROFILE` each kill yields one drop,
75% equipment (`categoryWeights: { equipment: 3, consumable: 1 }`), then `chooseEquipmentTypeEntry`
picks **uniformly over the 8 equipment types**, then uniformly over base items of that type whose
`levelRange` contains the item level:

```
P(specific base item, one kill) = 0.75 × (1/8) × 1 / |validBaseItems(type, itemLevel)|
P(seen by room R)               = 1 − Π(1 − p) over all kills in rooms 1..R
```

Two consequences worth watching: a Ring gets the same 1/8 as *all* one-handed melee weapons
combined, and when `validBaseItems` is empty at low item level `generateEquipment` silently returns
a **consumable**, so early-floor equipment rate is below 75%.

Weapons are 3 of the 8 types, so P(a drop is a weapon) ≈ 28%, and P(no weapon at all across floor 1)
≈ 2%, falling to ~0.04% after two floors. **The starting-gear case is a reference line, not a
percentile** — it is below p1 after floor 1.

**Attack dispatch and action points.** `COMBATANT_MAX_ACTION_POINTS` is 2 and every basic attack
costs 1 AP (`cost-properties-templates/basic-attacks.ts`). `ATTACK` is a free composite that
dispatches to `AttackRangedMainhand` when wearing a usable two-handed ranged weapon, else
`AttackMeleeMainhand`, which spawns an `AttackMeleeOffhand` child unless the main-hand attack
consumed the turn (`attack-melee-main-hand.ts:83`). So:

The off-hand child is gated from the main-hand side: `requiresCombatTurnInThisContext`
(`attack-melee-main-hand.ts:38`) returns true — consuming the turn, so no off-hand child — when the
user wears a **usable shield**, a **usable two-handed melee weapon**, when the off-hand attack's own
`shouldExecute` is false, or when the action was countered. So attacks per turn by configuration:

| Holdables | Attacks | Notes |
| --- | --- | --- |
| Two-handed melee | 1 | `TWO_HANDED_WEAPON_BASE_BONUS_DAMAGE_MODIFIER` 2×, `TWO_HANDED_WEAPON_AFFIX_VALUE_MULTIPILER` 2× |
| Bow (two-handed ranged) | 1 | dispatches to `AttackRangedMainhand` |
| 1h + shield | 1 | **the shield costs the entire off-hand attack** |
| 1h + 1h | 2 | off-hand at `OFF_HAND_DAMAGE_MODIFIER` 0.6, `OFF_HAND_ACCURACY_MODIFIER` 0.75, `OFF_HAND_CRIT_CHANCE_MODIFIER` 0.6 |
| 1h + empty | 2 | off-hand strike is **unarmed** (`KineticDamageType.Blunt`), same off-hand modifiers |

You cannot main-hand attack twice in a turn. Dual-wield is therefore typically lower DPS than
two-handed, and buys affix surface area on a second item instead. Assume characters spend all
action points attacking.

The shield check is on a **usable** shield, so a broken shield or one whose requirements are unmet
stops blocking the off-hand attack — your shield breaks and you start punching with that hand.
Because a shield costs a whole attack, the holdable configurations are genuinely distinct choices
rather than a shield being offensively free.

**Attribute requirements are set-based and mutually enabling.** `getCombatantTotalAttributes` adds
every equipped item's attributes first, *then* subtracts any item whose requirements still are not
met. Wearing two items to enable a third is legal and intended. `canEquip` blocks equipping
something you do not qualify for, but nothing re-validates afterward, so an item can become illegal
by unequipping its enabler or by breaking — it stays in the slot and contributes nothing.
`getWeaponsInSlots({ usableWeaponsOnly: true })` applies the same check, so an illegal weapon gives
neither attributes nor weapon damage; you swing unarmed.

Known quirk, low priority: the subtraction pass is single-pass and order-dependent, so an item
checked before its (broken, about-to-be-stripped) enabler keeps its own attributes even though the
final totals no longer meet its requirement. Needs an unusable attribute-granting item to trigger.
Not worth fixing on its own; worth knowing if attribute totals ever fail to reconcile.

Latent inconsistency, not currently reachable: `canEquip` reads `getTotalAttributes()`, which
includes conditions, but the equipment subtraction pass runs *before* conditions are added
(`get-combatant-total-attributes.ts:86` vs `:107`). A condition granting a core attribute would let
you equip an item that then contributes nothing even while the buff is up. The only two conditions
with `getAttributeModifiers` today are Ensnared (Evasion) and Blinded (Accuracy), both negative and
both on attributes nothing requires. Fixing it is a game-rules choice — move conditions above the
pass, or exclude them from the equip check — not a mechanical change.

**Affix values barely spread.** `getAttributeAffixValueRange` puts the `- 1` inside the round, so
max − min is exactly 2 at every tier. Tier nearly determines value. Spread across runs comes from
*which base item dropped*, not from affix rolls — so affixes do not need analytic modelling, just
`EquipmentBuilder.randomizeAffixes()` under `allFixedPolicy(rollQuality)`.

### The solver

Given an inventory, a `CharacterPolicy`, and the dummy, choose an attribute allocation and an
equipment set maximizing the objective.

Both allocation and equipment are smooth *except* at thresholds, and the thresholds come from
weapons and from the speed cutoffs. So:

1. **Enumerate holdable configurations** as the outer axis: `2h melee`, `bow`, `1h + shield`,
   `1h + 1h`, `1h + empty`, with actual item choices inside each. Holdable slots are **coupled** — a
   two-hander occupies both hands, a shield only fits off-hand — so they cannot be enumerated as a
   product across slots.
2. **Seed the attribute allocation** at `{requirement threshold for each candidate weapon}` ∪
   `{minimum allocation reaching average enemy speed}` ∪ `{minimum reaching half}`, then hill-climb
   the remaining points by marginal gain. Seeding is what stops greedy from stalling just below a
   threshold that unlocks a big weapon or a speed bracket. At level 10 that is 45 points over 5
   attributes, so climbing in chunks is ~45 evaluations per seed.
3. **Pareto-prune the independent wearable slots** — head, body, ring, amulet — then enumerate the
   survivors exhaustively. An item beaten on *every* axis by another item for the same slot can
   never be part of an optimal set, so the prune is lossless. Axes must include all five core
   attributes, AC, Accuracy, Evasion, flat and percent damage, **and requirements inverted** (an
   item demanding less is better, all else equal). Exhaustive enumeration over the survivors is what
   gets the two-items-enable-a-third case exactly rather than heuristically.
4. **Score every candidate through real game code** — build it, run `getCombatantTotalAttributes`,
   compute expected damage through the real hit/crit/AC path. Never reimplement legality; the
   single-pass quirk above means a reimplementation would silently disagree with the game.

Pruning weakens as the item model gets richer — with enough axes almost nothing is dominated. If the
frontier stops shrinking the search enough, fall back to a beam search keeping the best ~50 partial
sets per slot. That one is an approximation, but a controllable one.

### Shape

Framework-free domain code, no React, so it is testable and worker-runnable.

```
balance-visualizer/src/
  metrics/     built Combatant → { dps, effectiveHp, speed, objective }
  solver/      (inventory, policy, dummy) → { allocation, equipmentSet }
  sim/         room timeline → per-room snapshots for one seeded run
  analysis/    N runs of snapshots → percentiles and item tables
```

```ts
interface CharacterPolicy {
  combatantClass: CombatantClass;
  offenseWeight: NormalizedPercentage; // 1 = pure dps, 0 = pure survivability
}

interface CharacterRoomSnapshot {
  level: number;
  totalAttributes: CombatantAttributeRecord;
  equipped: EquippedItemRecord[]; // { baseItemKey, prefix, suffix }
  seenSoFar: BaseItemKey[];
  dps: number;
  effectiveHp: number;
  speed: number;
}
```

`sim` emits `CharacterRoomSnapshot[room][character]` per run. Every chart is an aggregation over
that array, so `sim` never needs to know what charts exist.

Fix the seed set across tuning changes or a real delta cannot be told from dice.

### Outputs

1. **Item table**, one row per base item: `P(dropped by room R)`, `P(equipped at room R)`, and the
   ratio — **pick rate given availability**. The third column is the one that answers "which weapons
   need improving"; an item that drops constantly and is never worn is invisible in the first two
   columns alone. Same table keyed by affix.
2. **Attribute table**, per class per room, p10/p50/p90 of each attribute. Read directly as "at room
   14 the median warrior has 24 Str", which is how item requirements get set.
3. **Objective trace**, per character per room: percentile bands for DPS, EHP and speed, with a
   histogram cross-section at any selected room.

Report **percentiles, never a mean**. The equip decision is a `max()` over draws and expectation
does not commute with max. Percentiles are also honest under any distribution shape, whereas
mean ± 3σ is only meaningful if the distribution is Gaussian and can print a number above the
analytic ceiling, which is a hard bound.

Expect the shape to change along the run rather than being one distribution: bimodal on floor 1
("got a weapon" vs not), roughly bell-shaped through the middle floors as several slots each
contribute an increment, and tight and left-skewed late as each slot saturates against the best
available. The changing shape is itself a finding.

### Build sequence

Each step has a visible output.

0. **Timeline, XP, levels.** No loot, no solver. Output is a room → level table. Validates the XP
   spine before anything depends on it.
1. **Loot stream.** `LootGenerator` over the timeline, recording every drop. Produces
   `P(dropped by room R)` with **no solver at all** — one of the two headline goals. Cross-check
   against the closed form above; if simulation and arithmetic disagree, find out now.
2. **Metrics.** Fixed loadout in, `{ dps, effectiveHp, speed, objective }` out. Pure function, unit
   testable, no simulation.
3. **Solver.** Steps 1 and 2 combine. The hard one.
4. **Aggregation and UI tables.**

Steps 0–2 ship something usable even if step 3 turns into a slog.

### Out of scope for Part 1

Combat, monster damage, monster healing, conditions, durability wear, vending machines, shards,
per-floor target palettes, hotswap slots, pets.

Durability deserves a note: found items roll 25–75% durability
(`FOUND_ITEM_MIN/MAX_DURABILITY_MODIFIER`), so nothing arrives broken, and with no combat nothing
wears. "Accounts for broken equipment" reduces to the solver respecting `isBroken()`, which never
fires in Part 1. The cheap upgrade if it is ever wanted is
`wear ≈ monsters_in_room × turnsToKill × DURABILITY_LOSS_CHANCE`, but that drags the dummy back
into the simulation loop, and not needing it is Part 1's whole virtue.

Vending machines are the omission most likely to matter: one of the seven rooms per floor is a
`VendingMachine`, shards accrue from discarded items, and crafting is a real gear source. Ignoring
it understates gear quality by an unknown amount.

---

## Part 2 — attacks-only simulated battles

Later. Recorded so Part 1 does not design it out.

Create the party, fight each room with a fixed target priority:

- use an autoinjector on any ally below 30% HP
- attack something with a >50% chance to land the killing blow
- attack the target you would deal the most expected damage to
- attack the target with the lowest HP

After each battle, use autoinjectors on any allies below 50% HP, then run the equipment solver over
the dropped loot for each character.

Notes for when this starts:

- **Every spawnable monster has `CombatActionName.Attack`** (only `Net` has an empty action list,
  and it is not in the spawn tables), so an attacks-only model is uniform with no special cases.
- **Exact on floor 1** — Zombie, Wolf, VampireBat are `Attack` and nothing else. Floors 2–3 add
  casters and healers: Slime has Fire, Spider has Ensnare + Healing, Cultist has Fire/IceBolt/Healing,
  MantaRay has IceBolt/Healing.
- **Monster healing hits the offense half, not the defense half.** A self-healing Spider or MantaRay
  stretches time-to-kill, so attacks-only makes party DPS look better than it plays from floor 2
  down. Ensnare does the same from the other side by cutting Evasion. The honest caption is "exact
  on floor 1, increasingly optimistic below", not "an upper bound on incoming damage".
- **Monster basic-attack damage has its own spread** — `appendMonsterEquipment` rolls their gear
  through the RNG policy, so incoming damage is a distribution per monster type, not a constant, and
  should be sampled per run alongside the loot.
- `processCombatAction` in `common/src/action-processing` is the layer to drive: synchronous,
  returns a replay tree, no fake timers needed. Animation lengths **do** affect outcomes; get them
  from `HttpGameplayAssetFactsSource` against the running asset server.
