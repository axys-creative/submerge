# Submerge

Canvas 2D submarine game (Vite + TypeScript). Zone data is in `src/data/zones.ts`, upgrades in `src/data/upgrades.ts`. Shop descriptions for upgrades are built from the numbers in `STATS` there, so change a number once and the shop updates.

## Catalog zone

The last zone, Catalog, is a test zone reached with the zone stepper in the test panel (hidden from the route map). It is always daytime with no creature movement. Next to the ship it lays out every plant, rock, bone, item and wreck on a shallow floor, then every animal in open water, each with a name tag. The layout is in `src/data/catalog.ts`; new creatures, items and scenery kinds should be added there so they show up.

## Design guidelines

- Caves should feel open, big and majestic, never confined. Follow Echo Caverns in Sunny Shallows (`cave` in `src/data/zones.ts`): tunnels around 190 px in radius as listed (drawn at that size; `TUNNEL_WIDEN` in `src/game/world.ts` scales them, 1.5 before they were trimmed by a third), some side tunnels half that at 95 px, chambers 250 px or more, no tight squeezes.
- The exception is a few thin side tunnels (listed radius around 105 px) kept as deliberate tight squeezes, like the one running west from Echo Caverns.
- Cave bends alternate between diagonal cuts and smooth curves, and walls waver. This is automatic in `buildCave` (`src/game/world.ts`).
- Keep the headland above a cave tall enough that wide tunnels do not break through the sea floor.
- Items are sparse: each zone has about half the items it once did. Most rest on the floor; only bottles float, sometimes.

## Ideas / to-do

Planned, not built yet. Details are open for discussion.

### Submarine skins

Built so far: `SkinId` in `src/data/skins.ts`, `save.skin`, a Skin row in the test panel, and three skins, all in `drawSub` (`src/art/sub.ts`). Skins are cosmetic only and never change what the upgrades do.

- Standard: the original sub.
- Expedition Capsule (`capsule`): a white tube with a metal dome nose, a top fairing and a side thruster. It drops the tower, antenna, tank and battery but still shows the other upgrades' looks.
- OceanGate (`oceangate`): a plain white rectangle with a swept tail, a brass dome nose and black landing gear. It ignores the upgrades' looks entirely.

Still open: how a skin is unlocked (a code found in a cave, or sold in a shop).

Next skin, planned but not started: a deep-sea research sub in the style of the one used for the Mariana Trench dive (tall and vertical, a green hull, a side panel of lights, batteries, boom arms for a light and a camera, a stabilizer fin, weights). This one is different in kind: it gets its own fixed stats that the normal upgrades cannot change while it is equipped, and its spotlights sit in different places, so the lamp and light positions in `sub.ts` and `scene.ts` need to come from the skin instead of being fixed.

### Craftable mechanical arm

- The claw stops being a default part of the sub and becomes an upgrade.
- Crafting needs two kinds of parts: one found out in the ocean, one bought with money from selling hauls.
- Uses: reach treasure that is stuck or hard to reach, and clear moss-covered caves that block the way.
- Moss-covered cave routes would gate parts of the cave systems (see Echo Caverns in Sunny Shallows) until the arm is built.

### Fishing net

- A net the sub can deploy to catch fish, which can then be sold.
- Drawbacks: while the net is out, bumping into anything (sea floor, walls, not just creatures) breaks it. It also drags below the sub.
- Keeps the net a deliberate, risky choice rather than something left out all the time.
