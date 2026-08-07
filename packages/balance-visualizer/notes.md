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

**Loot distribution is a whole-party re-solve, not per-item greedy.** Superseded the original
"each item to whoever gains most, in drop order" decision: marginal per-item evaluation cannot see
combinations, so the +Strength rags that make a two-hander wieldable look worthless on their own and
both get abandoned. The party solver runs after each loot acquisition event — see below.

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
(`random-dungeon-generation-policy.ts`). `ROOM_FILL_BUDGET` of 1 against costs around 0.33 gives ~3
monsters per room. At `BASE_XP_PER_MONSTER` 30 split three ways that is ~10 XP per character per
monster, and `BASE_XP_LEVEL_DIFF_MULTIPLIER` 0.25 governs it toward the floor's level.

**Measured 2026-08-05 by the step 0 walk** (one unseeded run, three characters, all ten floors):

| | f1 | f2 | f3 | f4 | f5 | f6 | f7 | f8 | f9 | f10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| level on clearing | 2 | 3 | 4 | 4 | 5 | 6 | 7 | 7 | 8 | 9 |

62 rooms total, 108 equipment dropped. **Level tracks the floor number, not floor + 1, and slips a
level behind twice — and the party finishes the dungeon at 9, never reaching `COMBATANT_MAX_LEVEL`.**
So characters fight even-level monsters the whole way down. Worth deciding whether that is intended
before tuning anything against it.

The governor is confirmed quantitatively: on floor 3 at level 4, a room of 3 monsters awarded 22 XP
— `10 + 10 × 0.25 × -1 = 7.5` per monster, floored after summing. Exactly the formula.

**Floor 1 has 8 rooms, every other floor has 6.** Floor 1 gets a leading `Empty` room and the only
boss (`BOSS_SPAWN_TABLES` defines TyrantRex for floor 1 and null for 2–3, nothing beyond). The last
two rooms of every floor — vending machine and staircase — award no experience and drop nothing, so
the room axis has predictable flat spots.

**Experience is consumed on level up.** `convertExperienceToClassLevels` subtracts
`requiredForNextLevel` from the running total, so `experiencePoints.getCurrent()` is progress toward
the *next* level, not lifetime earned. Anything wanting a lifetime figure has to accumulate the
`experiencePointChanges` returned by battle resolution — `DungeonExpedition` does. Level is capped
at `COMBATANT_MAX_LEVEL` inside that same loop.

**All party members level in lockstep.** `generateExperiencePoints` divides each monster's award by
the eligible member count and applies the level-difference modifier per character, so three
characters starting together stay identical for the whole run. The "expected level at room R" axis
is therefore one number for the party, not one per character. If that ever stops being true the
axis changes meaning.

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
| Two-handed melee | 1 | `TWO_HANDED_WEAPON_AFFIX_VALUE_MULTIPILER` 2× on affix values only |
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

### The party solver

Runs after each loot acquisition event, over the whole party at once.

1. **Pool everything on the ground** — equipped items, character inventories, and the new drops.
   Reassignment is global rather than incremental, so nobody keeps a now-worse item out of inertia
   and there is no path dependence in the equipment decision.
2. **Find each character's best holdable set** (main hand + off hand, or a single two-hander) for
   their goal, walking configurations in descending score. For each candidate, check whether it can
   actually be equipped, searching the pool for items granting the attributes it requires. If it
   cannot be equipped, move to the next configuration.
3. **Rank claimants by loss-if-denied**, not by absolute score — the standard term is *regret*. A
   character's claim strength is their best achievable score with the set minus their best without
   it. Ranking by absolute score would let the warrior, with the highest base damage, monopolize the
   pool regardless of who needs what.
4. **Assign the set together with the support items that make it legal**, all equipped in the same
   step. This is why the later pass cannot strip an enabler: it is already off the ground.
5. **Repeat against the reduced pool** until all three characters are settled.
6. **Distribute what remains on the ground** across free slots — scoring *whole loadouts*, never
   per-slot stats in isolation. That is the entire guard needed against a leftover ring breaking the
   armor it displaces: a broken item contributes nothing through `getCombatantTotalAttributes`, so
   the score collapses on its own. Do **not** add a rule forbidding it — sometimes the ring is worth
   more than the armor it kills, and a rule would get that case wrong.
7. **Store the remainder in character inventories** up to `INVENTORY_DEFAULT_CAPACITY`, then
   **convert leftovers to shards** (`CombatantTraitType.CanConvertToShardsManually`, valued by
   `getItemSellPrice`). Shards are inert while vending machines are out of scope — recorded, not
   spent.

Greedy character ordering is still not optimal: character one may take a weapon that was character
three's only option while their own second choice was nearly as good. Regret ranking absorbs most of
it, and solving it exactly needs an assignment algorithm over sets that share items. Not worth it.

This models a perfectly coordinating party with shared information. Real players in a race grab fast
and imperfectly, so results skew optimistic — a UI caption, not something to correct for.

### The per-character solver

Given a candidate pool, a `CharacterPolicy`, and the dummy, choose an attribute allocation and an
equipment set maximizing the objective.

**Attribute allocation is irreversible and equipment is not.** `characterSpentAttributePointHandler`
calls `allocatePoint` one point at a time and there is no deallocate or respec handler anywhere, so
a solver that re-optimizes allocation every room is silently respeccing. Allocation is commit-forward
and path-dependent, which is realistic — players do strand points.

Rather than guess at optimal-under-uncertainty, allocation is a **swappable policy** alongside the
RNG, dungeon generation and character creation policies, with two implementations to compare:

- **Spend on receipt** — at each level up, put the 5 new points wherever best serves the goal now.
- **Hoard** — bank points and spend only the minimum needed to clear a gate.

The policy has **two call sites**: `onLevelUp`, and the equipment set evaluator. Spend-on-receipt
does its work in the first and declines in the second; hoarding declines in the first and can only
decide in the second, where a candidate set makes "do I need points to wear this" answerable. A
hoarder spends the minimum to clear the gate, never more, or it forfeits the flexibility that is the
point of hoarding.

The gate that triggers a hoarder must be "**unlocks an item _or_ crosses a speed bracket**". Speed
is a goal term rather than an equip requirement, so a hoarder triggered only by equip requirements
never buys Agility, sits permanently under the floor's enemy speed, and reads as a bad strategy when
really the trigger was too narrow.

A free-respec oracle is worth building later as an unreachable ceiling above both. The gap between
committed and oracle allocation measures how harshly the attribute system punishes planning
mistakes.

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

### Armor class is linear in effective HP (derived 2026-08-06)

```
EHP multiplier = f(d)|ac=0 / f(d)|ac = d / [2.5d² / (ac + 2.5d)] = 1 + ac / (2.5 · d)
```

So armor class buys **exactly linear** effective hit points, slope `1 / (2.5 × damage per hit)`.
There are no diminishing returns and **no cap** — unlike evasion, which dies at `accuracy − 5` once
`MIN_HIT_CHANCE` clamps. Stacking armor class scales forever; decide whether that is intended.

Verified against the pipeline: a floor-5 two-handed training dummy with base values 15–29 (mean 22)
at AC 30 predicts `1 + 30/55 = 1.545`, measured 1.54.

Consequences:

- Armor class cannot be priced as one number. Its worth is inversely proportional to the attacker's
  damage **per hit**, so it is one number per attacker hit size, with the formula converting between
  them. Measured at floor 5, AC 30 was worth 1.54x against the two-hander and 1.74x against the dual
  wielder.
- Sweeping armor class is therefore redundant for single-attack shapes — the closed form is exact.
  Keep the sweep for dual wield, where two attacks of different sizes mean the multiplier is not a
  clean function of one mean, and as a check that formula and pipeline agree.
- Do not describe armor class as "diminishing" — the *damage* function is convex in damage, but the
  EHP multiplier is linear in AC. Two different statements, easy to conflate.

Pricing armor class as **one number per floor** is still the right granularity for a monster budget.
Aggregate it as `Σ dᵢ / Σ (dᵢ / mᵢ)` — sum the damage across the expected attacker mix, then divide —
not as an average of the per-attacker multipliers. Since the multiplier is `1 + ac/(2.5·d)`,
averaging multipliers hits `E[1/d] ≠ 1/E[d]` and overstates; the correct form is a damage-weighted
harmonic mean. Measured at floor 5 with a 50/50 mix the two forms differ by 0.3% (1.647 vs 1.652),
so this only matters when hit sizes diverge sharply — a boss landing one huge hit alongside
small-hit adds. Report the aggregate as the headline with the per-shape numbers underneath, since a
build budgeted against the average can still be soft against one shape.

**Standing rule, third time it has come up:** aggregate the quantity, then take the ratio. Never
average ratios, and never average inputs before a non-linear function. Same error as averaging
monster stats instead of averaging per-monster damage results, and as folding crit into the mean
before armor class.

### Physical and magical mitigation are disjoint (found 2026-08-06)

Spells use `BASIC_SPELL_HIT_OUTCOME_PROPERTIES`, whose accuracy is `ActionAccuracyType.Unavoidable`,
so `getActionHitChance` returns 1 outright — **evasion does nothing against magic**, and spells are
also unparryable and cannot trigger counterattacks. `MagicalResourceChangeCalculationStrategy`'s
`applyArmorClass` is an empty method, so **armor class does nothing against magic either**. Only
Spirit reduces it, through `getMagicalDamageReduction`.

Evasion, armor class and shield block therefore answer physical damage; Spirit alone answers magic.
Which gives the natural ceiling on stacking physical defence — if a fraction `m` of incoming damage
is magical:

```
max EHP multiplier from all physical mitigation = 1 / m
```

At 30% magic damage, evasion and armor class *together* cap at 3.3x however far they are stacked.
This supersedes the earlier claim that armor class is uncapped: it is uncapped against physical
damage, but total effective HP is bounded by the magic share, and so is the evasion cliff.

**Report EHP against physical and against magic separately.** The blend hides the cases worth
reasoning about — a player who knows a floor has no casters is in the physical-only column, and the
balance implications there are different. Blend only when asking about a specific damage mix; the
two separate figures are the primitives. The magic column is short by construction: evasion, armor
class and block are all worth exactly zero against it, leaving only hit points and Spirit.

Closed forms for three of the four defensive stats, so no sweep is needed for any of them — only
shield block is still unmeasured:

| stat | EHP multiplier | shape |
| --- | --- | --- |
| armor class | `1 + ac/(2.5·d)` | linear, gentle |
| evasion | `baseHit / max(MIN_HIT_CHANCE, acc − eva)` | linear, then a wall → ~20x max |
| spirit | `1 / (1 − spirit/200)` | hyperbolic, unbounded at 200 |

`getMagicalDamageReduction()` is `min(1, spirit × 0.5 / 100)`, so **200 Spirit is literal immunity
to magic**, and the curve has *increasing* marginal returns — 100 Spirit doubles EHP, 150 quadruples
it. That rewards all-in stacking, and a Mage's class growth plus attribute points plus gear affixes
reaches the accelerating region during normal play. Of the three it is the one most in need of a
decision; the usual remedy for a percentage-reduction stat is an asymptotic form such as
`spirit / (spirit + k)`, which approaches 100% without reaching it.

Consequences:

- Every measurement taken against the melee-only training dummies is an **upper bound** on physical
  mitigation's worth.
- The third training dummy should be a **caster**, not a projectile. A projectile attacker with the
  same accuracy and one hit per turn is arithmetically identical to the two-hander; magical versus
  physical is the axis that changes which stats respond at all.
- Evasion is `Agility × Evasion` ratio, and gear evasion affixes contributed **zero** in sampled
  best-in-slot builds — it comes almost entirely from allocated Agility. The ratio was dropped from
  2 to 1 on 2026-08-06, for affix reasons rather than cliff reasons: derived-attribute affixes roll
  2.5x a core-attribute affix, so at ratio 2 an Agility affix gave 2x evasion *plus* Speed and left
  a dedicated evasion affix only 1.25x better. At ratio 1 the evasion affix is a real 2.5x trade
  against losing the Speed.

### Open: block chance and block mitigation

`ResourceChangeModifier.applyPostHitModifiers` takes a `wasBlocked` flag, and metrics currently
passes a constant rather than weighting by `HitOutcomeMitigationCalculator.getShieldBlockChance`.
Harmless while the dummy carries no shield (block reduction is zero), wrong as soon as one does.

It matters more than it looks: a shield costs the entire off-hand attack, and block is where that
cost is earned back on the EHP side. Shield versus dual-wield cannot be settled until block chance
and reduction are modeled on the character, not just the dummy. The principled shape is the same
weighted branch used for crits — `(1 − blockChance) × unblocked + blockChance × blocked`.

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

## Handoff (2026-08-06) — design goals as axioms

The 2026-08-05/06 session kept hitting circularity: pricing a defensive stat needs an attacker,
building an attacker needs to know what defence is worth, sizing monster damage needs a character to
measure against, and so on. The way out is to stop deriving everything from everything else and fix
the **design goals** as the axioms, then derive downward. Each step below consumes a stated goal
rather than another derived quantity, so nothing loops.

### The goals

For a party with average gear access (runs within one standard deviation):

- Turns to kill a player who maximised **offence**: 3.5
- Turns to kill a player who maximised **defence** vs an average of all damage types: 9
- Turns to kill a player who maximised **defence** vs physical *or* magic specifically: 12
- Hit chance for a player putting 1/5 of allocations into accuracy: 90%
- Hit chance for a monster attacking a player with 1/5 of allocations in evasion: 90%

"Allocations" means every choice a player has: gear plus discretionary attribute points.

### Derivation order (this is what breaks the loop)

1. **Character HP and attribute curves** come from the class tables and allocation — already known,
   already measurable, no assumptions.
2. **Monster damage per turn** ← goal 1. `damagePerTurn = offenceBuildEHP / 3.5`. One division.
3. **Monster accuracy** ← goal 4/5. Accuracy is defined relative to the evasion a reference build
   actually has, not picked independently.
4. **Required defensive stat totals** ← goals 2 and 3. The offence-to-defence ratio is `9 / 3.5 ≈
   2.57x`, and the specialised case is `12 / 3.5 ≈ 3.43x`. These constrain what armor class,
   evasion and Spirit must be worth on reachable gear.
5. **Gear armor class and evasion ranges** ← step 4, inverted through the closed forms above.
6. **Weapon damage ranges** ← the turns-to-kill-a-monster goal, once monster HP is set.

Useful lever: **the offence/defence spread is independent of monster damage**, because dummy damage
cancels out of the ratio `turnsDefence / turnsOffence = EHP_defence / EHP_offence`. So step 4 can be
checked before step 2 is calibrated.

### Ambiguities in the goals to settle first

- **Turns versus hits.** "3.5, where 0.5 is a dual wielder's main plus off-hand average" mixes the
  two units. A dual wielder takes one turn to land two hits, so there is no half turn — the 0.5 only
  makes sense counting hits, and hits per turn differ by attacker shape. Specify in **turns** and
  let hit granularity be a free variable, or the same target means two different things depending on
  who is swinging.
- **"Defence vs phys or magic: 12"** needs to say *specialised against that type and measured against
  that type*. Physical and magical mitigation are disjoint (see above), so no build maximises both.
- **90% hit chance** is close to the current default — base class accuracy is already 78–90 before
  any Dexterity — so check whether goal 4 is actually binding or already satisfied.

### The offence/defence weighting, and how to calibrate it

The solver objective is `DPS^w × EHP^(1−w)`. `w = 0.5` is not arbitrary:

```
maximise TTD / TTK = (yourHP / enemyDPS) / (enemyHP / yourDPS)
                   = yourDPS × yourEHP / enemyHP
```

so winning the damage race *is* maximising `DPS × EHP`. Equivalently, "one fewer turn to kill is
worth one more turn to survive" — the breakpoint intuition and the geometric mean are the same
statement.

**Lanchester's square law** says `w` should sit above 0.5. In concentrated-fire engagements combat
power scales with the *square* of unit count, so removing an enemy is worth more than a proportional
share — a corpse deals no damage, and 3v2 is much better than 3v3. Offence therefore carries
defensive value that `TTD/TTK` does not capture.

Lanchester assumes continuous attrition, which a turn-based 3v3 is not, so it justifies `w > 0.5`
without fixing the value. Default to **0.6–0.65 provisionally** and calibrate empirically once Part
2 exists: run identical builds at several values of `w`, simulate battles, and keep the `w` whose
ranking best predicts actual win rates. That is a real, decidable experiment — not something to
argue about.

### What is already built and working

- `sim/` — full ten-floor walk driving the real `DungeonExplorationManager` and real
  `Battle.resolveBattle`. Records levels, lifetime experience, and every equipment drop per room.
  Two tests green.
- `metrics/` — `ExpectedDamageCalculator` (samples rolls and crit branches inside the real
  mitigation pipeline) and `DamagePerTurnCalculator` (attacks per turn from the real gating
  predicates).
- `dummies/` — `TrainingDummyFactory` with two attacker shapes, weapons constructed directly with
  chosen damage ranges.
- `analysis/` — `BestInSlotFinder`, `ReferenceBuildFactory`, `BuildSpreadExperiment`.

### What to trust and what not to

- **Trust** the closed forms for armor class, evasion and Spirit — derived and checked against the
  pipeline.
- **Do not trust** absolute turns-to-die numbers. Training dummy damage and accuracy are
  placeholders; that is exactly what steps 2 and 3 above replace.
- **Do not trust** the spread table's floor-to-floor shape, and **do not trust `BestInSlotFinder` at
  all**. It is unsound in three ways:
  - Its `defensiveValue` scoring is an invented linear weighting, and armor class, evasion and
    Spirit have completely different curves, so no fixed weighting can be right.
  - Max-of-N sampling is an upward-biased estimator whose bias grows with the number of draws, and
    floors differ in how many base items are legal — so a floor with more legal items scores higher
    from having more lottery tickets, not better gear. This alone can produce the non-monotonic
    floor-to-floor results.
  - It is non-deterministic, which is a bad property for something meant to be a bound. It also
    ignores requirements and picks slots independently, so it cannot find enabling combinations.

  A sound version would enumerate the true maximum — every legal affix type at max tier and value —
  rather than sample. But the derivation order above mostly removes the need: step 5 computes the
  *required* armor class and evasion from the goals and checks the templates against it, which is
  inverting the question rather than searching for a maximum.

### Still missing

- A **caster training dummy** — no EHP-vs-magic figure exists without one.
- **Shield block** — the only defensive stat with no closed form. Note that a shield costs the whole
  off-hand attack, so block has to be worth roughly a third of a character's damage to break even.
- The equipment solver itself, and everything downstream of it.

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
