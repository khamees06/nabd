// Filters the hit face, not the whole mesh, so visible skin faces on a multi-material
// skinned mesh remain selectable while privacy-protected faces stay excluded.
export function isPrivacySurfaceHit(hit) {
  const object = hit?.object;
  if (!object) return false;
  const materials = Array.isArray(object.material) ? object.material : [object.material];
  if (Array.isArray(object.material) && Number.isInteger(hit?.face?.materialIndex)) {
    return Boolean(materials[hit.face.materialIndex]?.name?.includes('Local privacy'));
  }
  if (materials.length === 1) return Boolean(materials[0]?.name?.includes('Local privacy'));
  return false;
}
