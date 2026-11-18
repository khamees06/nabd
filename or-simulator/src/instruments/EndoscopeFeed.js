// Live endoscope feed using the same registered atlas as the patient study view.
export function createScopeFeed({ renderer, RenderTarget, Scene, PerspectiveCamera, SphereGeometry, Mesh, MeshStandardMaterial, AmbientLight, DirectionalLight, Vector3, DoubleSide, SRGBColorSpace, CanvasTexture, createCanvas, Group, PointLight, Color }) {
  const width = 960, height = 540;
  const target = new RenderTarget(width, height, { depthBuffer: true, stencilBuffer: false });
  target.texture.colorSpace = SRGBColorSpace;
  target.texture.generateMipmaps = false;
  const noSignalCanvas = createCanvas();
  noSignalCanvas.width = width;
  noSignalCanvas.height = height;
  const noSignalContext = noSignalCanvas.getContext('2d');
  noSignalContext.fillStyle = '#10191d';
  noSignalContext.fillRect(0, 0, width, height);
  noSignalContext.fillStyle = '#f2a99a';
  noSignalContext.font = '700 38px sans-serif';
  noSignalContext.textAlign = 'center';
  noSignalContext.fillText('NO SCOPE SIGNAL', width / 2, height / 2 - 8);
  noSignalContext.fillStyle = '#d3dfdf';
  noSignalContext.font = '18px sans-serif';
  noSignalContext.fillText('حاذِ فتحة التدريب ثم أدخل المنظار', width / 2, height / 2 + 34);
  const noSignalTexture = new CanvasTexture(noSignalCanvas);
  noSignalTexture.colorSpace = SRGBColorSpace;
  noSignalTexture.needsUpdate = true;

  const scene = new Scene();
  const camera = new PerspectiveCamera(68, width / height, 0.004, 1.8);
  const origin = new Vector3(0, 1.0, -0.15);
  const screens = [];
  let live = false;
  let anatomy = null;
  const practice = Group ? new Group() : scene;
  if (practice !== scene) scene.add(practice);
  const lensLight = PointLight ? new PointLight(0xfff1e6, .042, .52, 1) : null;
  if (lensLight) { lensLight.visible = false; scene.add(lensLight); }

  const ambient = new AmbientLight(0xf4d7ce, 0x4b3137, 1.15);
  scene.add(ambient);
  const key = new DirectionalLight(0xffd5c6, 2.0);
  key.position.set(0.2, 0.32, 0.28);
  scene.add(key);
  const fill = new DirectionalLight(0x9eb9d0, 0.55);
  fill.position.set(-0.3, -0.08, -0.45);
  scene.add(fill);

  const makeMaterial = (color, roughness = 0.72, extra = {}) => new MeshStandardMaterial({ color, roughness, metalness: 0.02, side: DoubleSide, ...extra });
  function ellipsoid(name, position, scale, color, roughness = 0.72) {
    const mesh = new Mesh(new SphereGeometry(1, 36, 24), makeMaterial(color, roughness));
    mesh.name = name;
    mesh.position.set(...position);
    mesh.scale.set(...scale);
    practice.add(mesh);
    return mesh;
  }

  // A dark, softly lit cavity shell surrounds a small set of recognizable organ-shaped proxies.
  const cavity = ellipsoid('Illustrative peritoneal cavity shell', [0, 0, -0.22], [0.43, 0.235, 0.54], 0x68464a, 0.92);
  cavity.material.color.setHex(0x765156);
  cavity.material.side = DoubleSide;
  ellipsoid('Liver training proxy', [0.17, -0.012, -0.18], [0.17, 0.085, 0.14], 0x8e4e4d, 0.8);
  ellipsoid('Stomach training proxy', [-0.145, -0.012, -0.19], [0.105, 0.09, 0.12], 0xb36c68, 0.76);
  ellipsoid('Gallbladder training proxy', [0.115, -0.09, -0.12], [0.028, 0.058, 0.026], 0x8a9a56, 0.58);
  ellipsoid('Cecum training proxy', [-0.105, -0.115, -0.37], [0.082, 0.078, 0.09], 0x9a625f, 0.84);
  ellipsoid('Small bowel loop A', [-0.02, -0.10, -0.28], [0.12, 0.045, 0.045], 0xb77b72, 0.86);
  ellipsoid('Small bowel loop B', [0.055, -0.13, -0.34], [0.105, 0.038, 0.048], 0xa96d68, 0.86);
  ellipsoid('Small bowel loop C', [0.02, -0.075, -0.43], [0.095, 0.04, 0.04], 0xc18a7c, 0.86);
  ellipsoid('Appendix training proxy', [-0.035, -0.155, -0.40], [0.014, 0.014, 0.075], 0xb97870, 0.8);

  // Contrasting reference points for tracking orientation and depth in the simulated image.
  ellipsoid('Amber training landmark', [-0.071, -0.196, 0.012], [0.024, 0.011, 0.024], 0xf7ac57, 0.56);
  ellipsoid('Teal training landmark', [0.066, -0.195, -0.014], [0.020, 0.012, 0.020], 0x59c8bf, 0.56);
  ellipsoid('Ivory training landmark', [0.012, -0.198, -0.071], [0.016, 0.010, 0.016], 0xf2dbbd, 0.52);

  function setAnatomy(layer) {
    anatomy = layer;
    practice.visible = false;
    scene.add(layer.scopeLayer);
    scene.background = new Color(0x251319);
    ambient.intensity = .85;
    key.intensity = .40;
    fill.intensity = .19;
    lensLight.visible = true;
  }

  function setScreenTexture(texture) {
    for (const screen of screens) {
      if (!screen?.material) continue;
      if (screen.material.map !== texture || screen.material.emissiveMap !== texture) {
        screen.material.map = texture;
        screen.material.emissiveMap = texture;
        screen.material.needsUpdate = true;
      }
    }
  }

  function render(crew, active, port = null) {
    const tip = active && crew?.tool ? crew.getToolTip() : null;
    live = Boolean(tip && (!port || tip.y < port.y - 0.004));
    if (!live) {
      setScreenTexture(noSignalTexture);
      return;
    }
    camera.position.copy(tip);
    if (anatomy) {
      anatomy.atlas.updateWorldMatrix(true, false);
      anatomy.scopeLayer.matrix.copy(anatomy.atlas.matrixWorld);
      anatomy.scopeLayer.matrixWorldNeedsUpdate = true;
      lensLight.position.copy(tip);
    } else camera.position.sub(port ?? origin);
    camera.quaternion.copy(crew.tool.quaternion);
    camera.updateMatrixWorld(true);
    const previousTarget = renderer.getRenderTarget();
    try {
      renderer.setRenderTarget(target);
      renderer.clear();
      renderer.render(scene, camera);
    } finally {
      renderer.setRenderTarget(previousTarget);
    }
    setScreenTexture(target.texture);
  }

  function attach(screenMeshes) {
    screens.length = 0;
    screens.push(...(screenMeshes ?? []));
    for (const screen of screens) {
      if (!screen?.material) continue;
      screen.material.emissiveIntensity = 0.34;
      screen.material.toneMapped = false;
    }
    setScreenTexture(noSignalTexture);
  }

  function dispose() {
    target.dispose();
    noSignalTexture.dispose();
    practice.traverse((object) => {
      if (object.isMesh) { object.geometry.dispose(); object.material.dispose(); }
    });
  }

  return { target, noSignalTexture, scene, camera, render, attach, setAnatomy, dispose, get anatomyActive() { return Boolean(anatomy); }, get live() { return live; } };
}
