# Submerge

Canvas 2D submarine game (Vite + TypeScript). Zone data is in `src/data/zones.ts`, upgrades in `src/data/upgrades.ts`. Shop descriptions for upgrades are built from the numbers in `STATS` there, so change a number once and the shop updates.

## Shop stock

Each upgrade has `stock` slots in `src/data/upgrades.ts`, one per purchasable level. A slot names the shop that holds it (it can name two, which then share the one unit of stock; none do now), so every shop sells at most one level of an upgrade and at most 3 kinds. Buying any level uses up the first unused slot that matches the shop, so the player can take the first level from a late shop and the last from an early one. Shops hide upgrades they have no slot for, and gray out ones that are sold out or maxed. Players are expected to sail back to earlier zones to shop.

| Zone | Shop | Sells |
|---|---|---|
| 1 Sunny Shallows | Coral Cove | Plating, Tank |
| 1 Sunny Shallows | Gull Rock | Battery, Propeller, Bumpers |
| 2 Coral Gardens | Pearl Atoll | Battery, Cargo Hold, Spotlight |
| 3 Kelp Canyons | Driftwood Dock | Plating, Propeller, Sonar, CO₂ Scrubbers |
| 3 Kelp Canyons | Lantern Isle | Tank, Bumpers, Spotlight |
| 4 Midnight Trench | Last Light Atoll | Tank, Spotlight, Sonar |
| 5 Moana Deep | Palm Atoll | Battery, Sonar, Electrolysis Unit |
| 5 Moana Deep | Trench Pier | Plating, Bumpers, dive weights |

Air gear is set by `gear` on the island in `src/data/zones.ts`, and the dive weights by `weights`.

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

Built so far: `SkinId` in `src/data/skins.ts`, `save.skin`, a Skin row in the test panel, and five skins, all in `drawSub` (`src/art/sub.ts`). Skins are cosmetic only and never change what the upgrades do.

- Standard: the original sub.
- Expedition Capsule (`capsule`): a white tube with a metal dome nose, a top fairing and a side thruster. It drops the tower, antenna and tank but keeps the battery pod, and still shows the other upgrades' looks.
- OceanGate (`oceangate`): a plain white rectangle with a swept tail, a brass dome nose and black landing gear. It ignores the upgrades' looks entirely.
- Deepsea Challenger (`challenger`): the tall green research sub from the Mariana Trench dive, drawn from a reference image in `src/art/challenger.ts` (a window onto its batteries, flood lights and a sampling arm on the front side, two stabilizing fins on the back, a camera dome with antenna rods). Cosmetic except for depth: while worn its safe depth is `CHALLENGER_DEPTH_RATING` (11,050 m, from its 16,500 psi hull: the 11,000 m Challenger Deep plus 50 m) instead of the plating's. It lies on its side while hooked to the ship and rights itself slowly once the tether has gone back up after launch (`subPose` in `src/game/game.ts`, 0 lying to 1 upright), then lies down again as soon as the tether drops near the surface on the way back. The sprite is mirrored for the water (utility arm leads) but not on the ship (fins down), so it launches facing opposite the ship, which keeps what's on screen the same, and turns when the player steers. The spotlight sits on its flood lights (`lampFor`) and the crane hooks onto its upward side (`anchorFor`). Its collision is the same as the other skins' and ignores its height. It unlocks with the Fully Loaded achievement (every upgrade maxed and all gear owned, set in `persist` in `src/game/game.ts`), which also counts toward the portal stone's achievements.
- SM-13 (`sm13`): the lost submarine from the Crimson Sea abyss, upright and without its bite marks, shrunk to the sub's size (`src/art/lostSub.ts`). It ignores the upgrades' looks. Unlocks the first time the sub arrives in the Crimson Sea through the portal (`updateTravel` in `src/game/game.ts`); the "unlocked" toast waits until 5 seconds into the next dive.

Unlocking: the first time the sub implodes from pressure (`wreck('pressure')` in `src/game/game.ts`), OceanGate is added to `save.skins` and the death screen shows an "unlocked" note. Skins are picked in the Skins section of the pause menu (settings), where locked ones show as "Locked". The Skin row in the test panel bypasses all of this. Once the dev testing tools are removed for the real game, that is the only way to get and change skins. The Expedition Capsule unlocks after the sub is wrecked 3 times in one game (`save.stats.deaths`, `CAPSULE_DEATHS` in `src/data/skins.ts`), for any cause; the count resets on a new game.

### Craftable mechanical arm

- The claw stops being a default part of the sub and becomes an upgrade.
- Crafting needs two kinds of parts: one found out in the ocean, one bought with money from selling hauls.
- Uses: reach treasure that is stuck or hard to reach, and clear moss-covered caves that block the way.
- Moss-covered cave routes would gate parts of the cave systems (see Echo Caverns in Sunny Shallows) until the arm is built.

### Fishing net

- A net the sub can deploy to catch fish, which can then be sold.
- Drawbacks: while the net is out, bumping into anything (sea floor, walls, not just creatures) breaks it. It also drags below the sub.
- Keeps the net a deliberate, risky choice rather than something left out all the time.
