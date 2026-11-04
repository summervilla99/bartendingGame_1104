import * as THREE from 'three';

/** Draws into an offscreen 2D canvas and returns it as a texture. */
export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 8;
  return t;
}

/** Standard material with the project's defaults (matte, low env reflection). */
export const M = (color, o) =>
  new THREE.MeshStandardMaterial(Object.assign({color, roughness: .6, metalness: 0, envMapIntensity: .35}, o || {}));

export function shadows(obj, cast, recv) {
  obj.traverse(o => { if (o.isMesh) { o.castShadow = !!cast; o.receiveShadow = !!recv; } });
  return obj;
}

/** Color multiplied above 1.0 so it blooms. */
export function hdr(hex, k) { return new THREE.Color(hex).multiplyScalar(k); }

/** LatheGeometry from [[radius, y], ...] pairs. */
export function lathe(pts, seg) {
  return new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg || 24);
}
