# Submerge

Canvas 2D submarine game (Vite + TypeScript). Zone data is in `src/data/zones.ts`, upgrades in `src/data/upgrades.ts`.

## Design guidelines

- Caves should feel open, big and majestic, never confined. Follow Echo Caverns in Sunny Shallows (`cave` in `src/data/zones.ts`): tunnels around 190 px in radius, chambers 250 px or more, no tight squeezes.
- Cave bends alternate between diagonal cuts and smooth curves, and walls waver. This is automatic in `buildCave` (`src/game/world.ts`).
- Keep the headland above a cave tall enough that wide tunnels do not break through the sea floor.
- Items are sparse: each zone has about half the items it once did. Most rest on the floor; only bottles float, sometimes.

## Ideas / to-do

Planned, not built yet. Details are open for discussion.

### Craftable mechanical arm

- The claw stops being a default part of the sub and becomes an upgrade.
- Crafting needs two kinds of parts: one found out in the ocean, one bought with money from selling hauls.
- Uses: reach treasure that is stuck or hard to reach, and clear moss-covered caves that block the way.
- Moss-covered cave routes would gate parts of the cave systems (see Echo Caverns in Sunny Shallows) until the arm is built.

### Fishing net

- A net the sub can deploy to catch fish, which can then be sold.
- Drawbacks: while the net is out, bumping into anything (sea floor, walls, not just creatures) breaks it. It also drags below the sub.
- Keeps the net a deliberate, risky choice rather than something left out all the time.
