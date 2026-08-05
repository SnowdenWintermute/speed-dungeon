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

- Monte carlo sampling of weapon availability by room/floor
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

Start with attack-only balancing

Average attack action damage per room

- average available equipment
- average damage range of available equipment (a hypothetical average equipment)
- average available attributes (gear+inherent+discretionary)
- expected combatant level
- show table of available weapons by room, their weights (how likely to have one by that time)
  their attack action damage range by likely attribute allocations (low std dev, avg, high std dev)

What determines attack action damage vs a target with average evasion

- combatant level
    - derived from expected experience points
- inherent attributes
    - derived from expected combatant level
- allocated attributes
    - derive from expected combatant level
    - consider point distribution
- equipped weapons
    - derived from average availability of every weapon
      by the time that room was reached
    - include dual-wield
    - consider possibility of +damage affixes?
- attributes from equipment
    - derived from average availability of equipment and average rolls on average affixes
    - consider discretionary equiping of preferred affixes

Best equipment solver

- checks what equipment combinations from drops-so-far best meet current goal (slider from dps to survivability)
- allocates attributes to meet requirements for desired equipment
- knows the average speed of monsters on the floor
- allocates/equips to stay within a threshold of speed
    - going from below to above the avg enemy speed of the floor is highly rewarded
    - dropping below 1/2 the avg enemy speed of the floor is undesireable
- accounts for broken equipment

Equipment-solver only data views

    - chance of each equipment type being available by room - chance of each equipment type being chosen to be equipped by room

Attacks-only simulated battles by floor

- create player party
- have them fight a room with target priority as
    - use autoinjector on ally with below 30% hp
    - attack something you have a >50% chance to last hit
    - attack the target you could deal the most expected damage to
    - attack the target with lowest hp
- after battle
    - use autoinjectors on any <50% hp allies
    - run equipment solver over the dropped loot for each character
