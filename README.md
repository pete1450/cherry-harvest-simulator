# Cherry Harvest Simulator

A three.js cherry shaking simulator: drive a long OMC one-man Shock Wave shaker through a 5 row × 8 tree orchard (40 mature trees), line the umbrella hub up on a trunk, deploy the 36 ft circular tarp umbrella around it, clamp the trunk, and shake it. Cherries fall onto the umbrella fabric and the static centre tarp, travel along the side and horizontal conveyors and the cross conveyor, and drop into the square tank on the left flank (520 cherries per tank).

When the tank is full, drop it with `T`, drive forward 6 m, and an NPC tractor comes from behind, drives around the dropped tank, and drops an empty tank in front of it. Back up to the empty tank and press `T` to pick it up.

## Controls

- Drive: `W/S`, steer `A/D`, or the on-screen joystick
- Tarps: `E`, or drag the tarps lever in first-person (down = umbrella out around the tree, up = umbrella back against the machine)
- Clamp: `G`, or the 2D joystick (lower-right = engage, upper-right = release)
- Shake: hold `Space` or HOLD TO SHAKE, or hold the 2D joystick lower-left (straight down = engage + shake together)
- Tank: `T`, or drag the tank lever in first-person (down = drop, up = pick up)
- View: `V` (third-person / first-person from the elevated operator seat)
- Drag the 3D view to orbit (third-person) or look around (first-person); double-click / double-tap resets the camera

Controls are never locked: you can clamp any time, and open/close the tarps any time. If you clamp when no tree is in the clamp, shake simply will not strip anything. You cannot drive while clamped, so release to drive on.

## Files

- `index.html` — the playable game, single file with three.js r147 inlined. This is what GitHub Pages serves from `main` / root.
- `game.js` — all game code.
- `build.py` — inlines `three147.min.js` + `game.js` into `index.html`.
- `three147.min.js` — vendored three.js r147.

## Build

Run `python3 build.py` from the sources directory. It writes the built `index.html` (the output path in `build.py` is the local workspace path; copy the result to the repo root for Pages).
