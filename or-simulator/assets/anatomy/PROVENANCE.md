# Internal anatomy atlas

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.

[Official license](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) · [Database and source mappings](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html)

`internal-atlas.glb` uses BodyParts3D element meshes and whole-lobe surfaces. Each exported mesh has its named system and original element IDs as glTF extras. The same list is in `structure-sources.json`.

- `FJ…` identifiers refer to BodyParts3D 4.3 geometries from the [preserved 4.3 source](https://github.com/olivercase/body_parts_3d_api/tree/fd527e6f4daf732fd814314d9257df5877b844bc). Concept names follow the source PART-OF mapping where a component belongs to a composite organ. For example, the cecum corresponds to FJ2599 in that mapping.
- `FMA…` identifiers refer to the BodyParts3D 3.0 [STL conversion](https://github.com/Kevin-Mattheus-Moerman/BodyParts3D/tree/f0eeb6e843380cfe6b83797cf8c3e1af74de5e61/assets/BodyParts3D_data/stl) for the whole liver and the five lung lobes. Historical copies carry CC BY-SA 2.1 Japan notices. Redistribution here follows the current DBCLS grant linked above.

Adaptations include grouping source elements, coordinate conversion, anatomical landmark fitting to the project patient, face and normal cleanup, polygon reduction, local smoothing and material coloring. The atlas is a reference adult male anatomy fitted to a separately authored surface. The registration was checked against the 3D patient mesh and does not use medical imaging or patient measurements. The brain group covers the available cerebral surfaces in this selection. The two cardiovascular vessels are a subset. Microvasculature, peripheral nerves, lymphatic anatomy and organ mechanics are outside this atlas.
