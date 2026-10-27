# Submerge

A submarine treasure-diving game for the browser, inspired by the old Flash game _Treasure Seas Inc._

Sail your ship across the surface, drop your sub, and dive for seaweed, junk and treasure. Dodge sharks, squid and anglerfish, sell your haul at island shops, and upgrade your sub to go deeper. Every upgrade changes how the sub looks.

## Run it

```bash
bun install
bun run dev
```

Then open http://localhost:5173.

`bun run build` type-checks and writes a static site to `dist/` that can be hosted anywhere (GitHub Pages, Cloudflare Pages, Netlify, itch.io).

## Controls

|                                | Keyboard                | Phone                 |
| ------------------------------ | ----------------------- | --------------------- |
| Sail the ship / steer the sub  | Arrow keys or WASD      | Drag on the left side |
| Dive                           | Space or ↓              | Dive button           |
| Shop or sail to the next zone  | E or Enter              | Shop / Sail button    |
| Hand-crank with a dead battery | J and K, back and forth | J and K buttons       |
| Menu, save codes               | Esc or P                | ☰ button             |

## How it plays

- **Docked**: the sub hangs from the ship's crane. Docking recharges the battery, refills air and repairs the hull.
- **Air** drains underwater and refills whenever you surface.
- **Battery** drains as you drive. When it's empty you can still hand-crank, slowly.
- **Plating** sets your safe depth. Below it the hull creaks and takes damage every few seconds.
- **Bumpers** set how many hits you survive (1 → 2 → 3).
- **Spotlight** and **Sonar** help you see and find things in the dark deep water.
- If the sub is wrecked or runs out of air, it gets towed back to the ship and you lose the cargo you haven't sold.

## Saving

The game saves automatically in the browser's local storage, so each player on each device has their own game. The menu has a **save code** that players can copy to back up their game or move it to another device.

## Adding content

Everything you'd tune lives in `src/data/`:

- `zones.ts`: each zone's width, sea-floor shape (a list of depths in meters from west to east), colors, darkness, islands, shipwrecks, scenery and which creatures live there. Zones connect in order: sail east off one to reach the next. Add a new entry to the end of the list to add a zone.
- `items.ts`: what you can find, what it sells for and which depths it appears at.
- `upgrades.ts`: upgrade names, prices and stats.
- `creatures.ts`: creature sizes and which ones hurt.

Art is drawn in code in `src/art/`, so it stays sharp at any screen size. Creature behavior is in `src/game/creatures.ts`.

## Project layout

```
src/
  data/      zones, items, creatures, upgrades
  game/      game loop, world generation, creature AI, input, saving
  art/       drawing code for the sub, ship, scenery, creatures, items
  render/    scene drawing and deep-water lighting
  ui/        HUD, shop, menus, touch controls
```
