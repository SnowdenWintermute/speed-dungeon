Desired visualization tables (per class, selectable with dropdown)

Table 1

- Inherent attributes by level with sliders for
    - percent allocation of discretionary points (slider for each attribute, all zero allowed but total capped at 100%)
    - percent allocation of hypothetical gear of affixes at that item level
        - a level 5 character would have access to level 5 items in this example
        - sub-slider for min-max rolls accross all gear slots

- Min/max damage by equipped item
    - rows are the item
    - columns are the character level
    - value are the min/max damage of attack mainhand and attack offhand
    - values linked to the selected slider positions on table 1

- dps vs selected monster (select input for monster type)
    - rows are weapon
    - columns are character level
    - values are average damage on target per turn by percent of target's hp
    - damage/accuracy values linked to the selected slider positions on table 1

How do we determine fair attribute requirements for gear:

- average total attributes per room cleared
    - include avg attributes from avg gear dropped divided by party size
    - include discretionary attributes from levelups
    - include inherent attributes from expected levelups

How do we balance weapon damage?

- Monte-carlo sampling of weapon availability by room/floor
    - on average, how many of each weapon will drop by the end of each floor
    - on average, how many of each weapon will drop by the end of each room
    - average damage across available weapons by room/floor

What affects turns-to-kill in an attack-only battle?

- character equipment
- character attributes
- monster equipment
- monster attributes

worries/complexities

- some monsters are hard to kill because of a certain attribute like high evasion or armor class
  or magic resistence,
  and visualizing that would require the dev sliding the character's allocation toward more dex
  or int
- will need a similar chart as weapons for the various spells for damage tuning
    - feed action list into the min/max damage table
- gear-score calculator based on drop chance of items and average chance of equipment affixes / rolls
- average shards per-level obtained
