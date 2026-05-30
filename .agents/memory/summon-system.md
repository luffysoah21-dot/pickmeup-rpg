---
name: Summon system design
description: Architecture decisions for the gacha/summon system and tower floor progression
---

## Owned Heroes
- Stored as `owned_heroes TEXT` in `playersTable` — comma-separated hero types (e.g. `"warrior,dark_knight"`)
- Default is `""` (empty string)
- Serializer parses to `string[]` for the API response: `player.ownedHeroes.split(",").filter(Boolean)`
- Starter heroes (warrior, mage, assassin) are ALWAYS selectable regardless of `owned_heroes`
- Rare/Epic/Legendary heroes require entry in `owned_heroes`

## Tower Floor Unlock
- Floor unlock is **level-gated only** — computed from player level, NOT stored in DB
- `getPlayerFloor(level: number): FloorDef` in `game-data.ts` returns highest accessible floor
- Floor levels: F1=1+, F2=6+, F3=16+, F4=26+, F5=41+

## Pity System
- `pity_epic` (INT): summons since last epic-or-better; guaranteed epic at 10
- `pity_legendary` (INT): summons since last legendary; guaranteed legendary at 50
- Both reset to 0 when legendary obtained; only pity_epic resets on epic

## Shared Game Data
- All hero defs, floor defs, summon pool live in `artifacts/rpg-game/src/lib/game-data.ts`
- Server-side gacha logic in `artifacts/api-server/src/routes/summon.ts` (duplicates pool defs intentionally — server is the source of truth for randomness)

**Why:** Keeping randomness server-side prevents client-side cheating. Floor state is derived from level to avoid sync bugs.
