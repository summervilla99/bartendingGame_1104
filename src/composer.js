import * as THREE from 'three';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass.js';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

/**
 * Post-processing chain: scene -> bloom -> final grade
 * (soft tone shoulder, vignette, slight chromatic aberration, film grain).
 * Uses a 4x MSAA half-float target when the browser supports it.
 */
export function createComposer(renderer, scene, camera, W, H, PR) {
  const hdrOK = renderer.capabilities.isWebGL2 && renderer.extensions.has('EXT_color_buffer_float');
  const opts = {
    type: hdrOK ? THREE.HalfFloatType : THREE.UnsignedByteType,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter
  };
  const pw = Math.round(W * PR), ph = Math.round(H * PR);
  let rt;
  try {
    rt = (renderer.capabilities.isWebGL2 && THREE.WebGLMultisampleRenderTarget)
      ? new THREE.WebGLMultisampleRenderTarget(pw, ph, opts)
      : new THREE.WebGLRenderTarget(pw, ph, opts);
  } catch (e) {
    rt = new THREE.WebGLRenderTarget(pw, ph, opts);
  }
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.85, 0.7, 0.82);
  composer.addPass(bloom);
  const finalPass = new ShaderPass({
    uniforms: {tDiffuse: {value: null}, time: {value: 0}, vig: {value: .62}},
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: [
      'uniform sampler2D tDiffuse;uniform float time;uniform float vig;varying vec2 vUv;',
      'float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}',
      'void main(){',
      ' vec2 c=vUv-.5;float d=dot(c,c);float ca=.0018*d*4.;',
      ' vec3 col=vec3(texture2D(tDiffuse,vUv+c*ca).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv-c*ca).b);',
      ' col=col/(1.+col*.28);',
      ' col=mix(vec3(dot(col,vec3(.299,.587,.114))),col,1.08);',
      ' col+=vec3(.010,.004,.014);',
      ' col*=1.-vig*d*1.5;',
      ' col+=(hash(vUv*vec2(1920.,1080.)+fract(time))-.5)*.03;',
      ' gl_FragColor=vec4(col,1.);}'
    ].join('\n')
  });
  composer.addPass(finalPass);
  composer.setSize(pw, ph);
  return {composer, bloom, finalPass};
}
