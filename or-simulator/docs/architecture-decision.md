# Architecture Decision — Web Prototype vs. Full Simulation Engine

## Current choice
Continue the browser prototype using the existing Three.js r180 runtime, now split into a maintainable project structure and external GLB assets.

## Why
- The existing room, operating table, equipment and patient scene already exist in this implementation.
- Three.js supports GLB loading, skeletal bone transforms, first-person camera rigs, raycasting and interactive 3D controls.
- The current project can be developed in VS Code and run with Node.js/Vite or Live Server.

## Important boundary
HTML is not the limiting factor for 3D. It hosts the application UI. Three.js can render and animate rigged characters, but a high-fidelity surgical simulator also needs:
- high-quality licensed human and medical-device assets;
- validated skeletons and animation clips;
- inverse kinematics and collision-aware hand/tool interaction;
- tissue-specific deformation and physics;
- clinical procedure logic and expert validation.

## Future engine decision
Do not migrate engines merely because a prototype has weak models or controls. First improve the rig, assets, camera and interaction architecture. If the project later requires complex real-time physics, advanced character animation, tactile simulation, or large-scale immersive VR, evaluate Unreal Engine 5 or Unity in a separate technical spike.

## Current v0.16 scope
This release adds finger articulation to the existing patient skeleton and fixes the camera-child rendering path for the trainee hands. It is a foundation, not a validated surgical training system.
