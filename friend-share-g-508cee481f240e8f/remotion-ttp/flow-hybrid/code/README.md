# Code package

`hybrid.tsx` is the Remotion entry. `physics/` contains the Blender Python scene, simulation, camera, and geometry-check scripts. Run commands from each directory shown in `../README.md`.

Remotion reads assets from `code/public/`:

- `flow-hybrid/approach.mp4`
- `flow-hybrid/physics.mp4`
- `flow-hybrid/reaction.mp4`
- optional `reference.mp4` for `ContactAudit` only

The three Flow/Blender input media are included. The compositor uses only the ranges documented in ../README.md. The optional original reference video is excluded.
