/** Thin lifecycle boundary around the existing Three.js scene/renderer/camera. */
export function createSceneManager({ scene, renderer, camera }) {
  if (!scene || !renderer || !camera) throw new TypeError('SceneManager requires scene, renderer and camera.');
  let disposed = false;
  return {
    scene, renderer, camera,
    render() {
      if (disposed) return false;
      renderer.render(scene, camera);
      return true;
    },
    resize(width, height, updateStyle = false) {
      if (disposed || width <= 0 || height <= 0) return false;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, updateStyle);
      return true;
    },
    getInfo() { return renderer.info; },
    dispose() { if (disposed) return; disposed = true; renderer.dispose?.(); },
    get disposed() { return disposed; },
  };
}
