# Patient Hand Rig Map

The patient GLB includes a skinned skeleton with hand/finger bones. The current v0.16 hand controls drive these existing bones rather than rotating the whole arm as a substitute for finger movement.

## Left hand
- Thumb: `finger1-1.L`, `finger1-2.L`, `finger1-3.L`
- Index: `finger2-1.L`, `finger2-2.L`, `finger2-3.L`
- Middle: `finger3-1.L`, `finger3-2.L`, `finger3-3.L`
- Ring: `finger4-1.L`, `finger4-2.L`, `finger4-3.L`
- Little: `finger5-1.L`, `finger5-2.L`, `finger5-3.L`

## Right hand
- Thumb: `finger1-1.R`, `finger1-2.R`, `finger1-3.R`
- Index: `finger2-1.R`, `finger2-2.R`, `finger2-3.R`
- Middle: `finger3-1.R`, `finger3-2.R`, `finger3-3.R`
- Ring: `finger4-1.R`, `finger4-2.R`, `finger4-3.R`
- Little: `finger5-1.R`, `finger5-2.R`, `finger5-3.R`

## Current motion model
- Each phalanx bone stores its original local quaternion.
- A local-axis flexion quaternion is applied on top of the original pose.
- Finger flexion is parameterized from 0.0 (open/rest) to 1.0 (closed demonstration pose).
- Left and right hands are controlled independently.
- The current axis and angular amplitudes are provisional and must be visually validated on the actual patient model.

## Not yet implemented
- Independent MCP/PIP/DIP sliders for every finger.
- Anatomically validated thumb opposition.
- Wrist flexion/extension and radial/ulnar deviation.
- Tendon coupling and passive finger motion.
- Patient-specific motor response or neurological response.
