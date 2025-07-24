Every unit is added to the threat table upon begining combat, and removed at the end of combat.
Threat is a positive number beginning at zero upon entry to the table.
(Leaving and re-entering combat starts at zero again.)
Each NPC tracks opponents using their own threat table.

The following actions accumulate threat while combat continues:

- Damaging the NPC adds one threat per one damage done
- Healing any of the NPC's enemies adds one threat per two effective healing done,
  divided by the number of NPCs who observed the heal
- Friendly buffs or on-use abilities may add a fixed amount of threat,
  divided by the number of NPCs who observed the ability

The NPC aggros to a new unit if that unit:

- Overrides the NPC's target using a Taunt or special ability
- Exceeds the previous target's threat by 10% while within melee range
- Exceeds the previous target's threat by 30% while outside melee range
