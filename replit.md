# Telegram RPG Game

A dark fantasy turn-based RPG Telegram Mini App inspired by "Pick Me Up" manhwa. Players choose a hero, battle monsters, level up, earn gold, and compete on a global leaderboard — all inside Telegram.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/rpg-game run dev` — run the frontend (port 20192)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `TELEGRAM_BOT_TOKEN`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, framer-motion
- API: Express 5
- DB: PostgreSQL + Drizzle ORM (Replit built-in)
- Telegram: telegraf.js (bot + mini app)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle table definitions (players, battles)
- `artifacts/api-server/src/routes/` — Express route handlers (players, battles, leaderboard)
- `artifacts/api-server/src/lib/telegram-bot.ts` — Telegram bot setup (telegraf)
- `artifacts/api-server/src/lib/player-serializer.ts` — camelCase→snake_case DB → API response mapper
- `artifacts/rpg-game/src/pages/` — game screens (Home, Heroes, Battle, Leaderboard, Shop)
- `artifacts/rpg-game/src/components/HeroArt.tsx` — CSS-only hero art
- `artifacts/rpg-game/src/components/MonsterArt.tsx` — CSS-only monster art
- `artifacts/rpg-game/src/lib/telegram.ts` — Telegram WebApp init + user fallback

## Architecture decisions

- Replit's built-in PostgreSQL is used (not Supabase) for player/battle data. `SUPABASE_URL`/`SUPABASE_ANON_KEY` are stored as secrets but the app uses `DATABASE_URL` for persistence.
- All DB models use camelCase internally (Drizzle convention); `player-serializer.ts` maps to snake_case for the OpenAPI/Zod contract.
- Telegram user identity is derived from `window.Telegram.WebApp.initDataUnsafe.user` with a localStorage fallback for browser testing.
- EXP formula: `floor(100 * 1.4^(level-1))` per level, max level 50.
- Telegram bot auto-detects the web app URL from `REPLIT_DOMAINS` at startup.

## Product

- **Main Menu**: Player stats (level, gold, EXP bar), hero portrait, navigation
- **Hero Selection**: 3 heroes (Warrior/Mage/Assassin) with CSS art, stats, skill upgrade
- **Combat**: Turn-based battles vs 5 monster tiers, animated HP bars, floating damage numbers, screen shake, item usage
- **Leaderboard**: Top players ranked by level + gold
- **Shop**: Flavor/stub screen for future purchases

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`
- DB objects use camelCase; API responses must use snake_case — use `serializePlayer()` in all player routes
- Telegram bot launches in `index.ts` after server is listening; it reads `REPLIT_DOMAINS` to determine the Mini App URL
- Bot uses long-polling (not webhook) in dev; switch to webhook for production

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
