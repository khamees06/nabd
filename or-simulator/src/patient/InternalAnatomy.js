export const anatomyLabels = {
  brain: 'المخ', cerebellum: 'المخيخ', brainstem: 'جذع الدماغ', pituitary: 'الغدة النخامية',
  pineal: 'الغدة الصنوبرية', thyroid: 'الغدة الدرقية', thymus: 'الغدة الزعترية',
  larynx: 'الحنجرة', airway: 'القصبة الهوائية والشعب الرئيسية',
  leftLung: 'الرئة اليسرى', rightLung: 'الرئة اليمنى', heart: 'القلب',
  aorta: 'الشريان الأبهر', venaCava: 'الوريد الأجوف السفلي', diaphragm: 'الحجاب الحاجز',
  esophagus: 'المريء', liver: 'الكبد', stomach: 'المعدة', gallbladder: 'المرارة', spleen: 'الطحال',
  pancreas: 'البنكرياس', duodenum: 'الاثنا عشر', smallBowel: 'الصائم واللفائفي', colon: 'القولون',
  rectum: 'المستقيم', cecum: 'الأعور', appendix: 'الزائدة الدودية', mesoappendix: 'مسراق الزائدة',
  leftKidney: 'الكلية اليسرى', rightKidney: 'الكلية اليمنى', adrenals: 'الغدتان الكظريتان',
  ureters: 'الحالبان', bladder: 'المثانة', prostate: 'البروستاتا', seminalVesicles: 'الحويصلتان المنويتان',
};

const abdomenExtras = new Set(['adrenals', 'diaphragm']);
const scopeSystems = new Set(['digestion', 'urinary', 'vessels']);

export async function loadInternalAnatomy({ source, loader, patient, Box3 }) {
  const { scene: atlas } = await (source instanceof ArrayBuffer ? loader.parseAsync(source, '') : loader.loadAsync(source));
  const organs = new Map();
  atlas.name = 'Registered patient organ atlas';
  atlas.traverse((object) => {
    if (!object.isMesh || !Object.hasOwn(anatomyLabels, object.name)) return;
    const key = object.name;
    organs.set(key, { key, label: anatomyLabels[key], system: object.userData.system, mesh: object });
  });
  const missing = Object.keys(anatomyLabels).filter((name) => !organs.get(name)?.system);
  if (missing.length) throw new Error(`Internal atlas is missing structures: ${missing.join(', ')}`);

  const scopeLayer = atlas.clone(true);
  scopeLayer.name = 'Internal anatomy for the endoscope';
  scopeLayer.traverse((object) => {
    if (!object.isMesh) return;
    const organ = organs.get(object.name);
    object.visible = Boolean(organ && (scopeSystems.has(organ.system) || abdomenExtras.has(organ.key)));
  });
  scopeLayer.matrixAutoUpdate = false;

  // Protected surface groups are omitted from the study view and restored with the patient skin.
  const skins = patient.skins.map((mesh) => {
    const solid = mesh.material;
    const original = { material: solid, cast: mesh.castShadow, receive: mesh.receiveShadow };
    const outlineMaterial = (material) => {
      const outline = material.clone();
      if (material.name?.includes('Local privacy')) outline.visible = false;
      outline.transparent = true;
      outline.opacity = .18;
      outline.depthWrite = false;
      return outline;
    };
    const outline = Array.isArray(solid) ? solid.map(outlineMaterial) : outlineMaterial(solid);
    return { mesh, original, outline };
  });

  atlas.visible = false;
  patient.root.add(atlas);

  function setVisible(visible) {
    atlas.visible = visible;
    for (const { mesh, original, outline } of skins) {
      mesh.material = visible ? outline : original.material;
      mesh.castShadow = !visible && original.cast;
      mesh.receiveShadow = !visible && original.receive;
    }
  }

  function show(system, selected, isolate) {
    for (const { key, mesh, system: organSystem } of organs.values()) {
      const match = system === 'all' || organSystem === system;
      mesh.visible = match && (!isolate || !selected || selected === key);
    }
  }

  function bounds(visibleOnly = true) {
    const box = new Box3();
    for (const { mesh } of organs.values()) {
      if (!visibleOnly || mesh.visible) box.union(new Box3().setFromObject(mesh));
    }
    return box;
  }

  return { atlas, scopeLayer, organs, setVisible, show, bounds };
}
