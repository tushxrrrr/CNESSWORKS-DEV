import * as THREE from 'three';
const CW = window.CW, host = document.getElementById('field'), S = CW.S;
try {
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: CW.small ? 'low-power' : 'high-performance' });
  renderer.setPixelRatio(Math.min(CW.small ? 1.5 : 2, devicePixelRatio || 1)); renderer.setClearColor(0, 0);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, 1, .1, 100); camera.position.z = 10;
  const rig = new THREE.Group(); scene.add(rig);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(CW.forms[0], 3));
  for (let k = 1; k < S; k++) geo.setAttribute('p' + k, new THREE.BufferAttribute(CW.forms[k], 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(CW.seed, 4));
  geo.setAttribute('aIdx', new THREE.BufferAttribute(CW.idx, 4));
  const V3 = a => a.map(c => new THREE.Vector3(c[0], c[1], c[2]));
  const U = { uScene: { value: 0 }, uTime: { value: 0 }, uIntro: { value: 0 }, uFade: { value: 1 }, uPR: { value: renderer.getPixelRatio() }, uStill: { value: 0 }, uScale: { value: 1 },
    uHi: { value: new THREE.Vector4(-1, -1, -1, -1) }, uMouse: { value: new THREE.Vector3(99, 99, 0) }, uCA: { value: V3(CW.colA) }, uCB: { value: V3(CW.colB) } };
  const attrs = Array.from({ length: S - 1 }, (_, k) => 'p' + (k + 1));
  const mixP = ['position * w(0., s)', ...attrs.map((a, k) => `${a} * w(${k + 1}., s)`)].join(' + ');
  const mat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute vec3 ${attrs.join(', ')}; attribute vec4 aSeed, aIdx;
      uniform float uScene, uTime, uIntro, uFade, uPR, uStill, uScale; uniform vec4 uHi; uniform vec3 uMouse; uniform vec3 uCA[${S}]; uniform vec3 uCB[${S}];
      varying vec3 vC; varying float vA;
      float w(float k, float s){ return max(0., 1. - abs(s - k)); }
      float hl(float id, float want){ return want < -.5 ? 1. : (abs(id - want) < .5 ? 1.75 : .5); }
      void main(){
        float sc = clamp(uScene + (aSeed.x - .5) * .5 * (1. - uStill), 0., ${S - 1}.);
        float k = floor(sc), f = fract(sc); f = f * f * (3. - 2. * f); float s = k + f;
        vec3 p = ${mixP};
        float live = 1. - uStill;
        float rr = length(p.xz);
        p.y += w(8., s) * sin(rr * 3.2 - uTime * 1.6) * .07 * live;                                  // ripples travel outward
        p *= 1. + w(10., s) * sin(uTime * 1.3 + aSeed.y * 6.283) * .05 * live;                        // the sun pulses
        p += live * .035 * vec3(sin(uTime * .7 + aSeed.y * 40.), cos(uTime * .6 + aSeed.z * 40.), sin(uTime * .5 + aSeed.w * 40.));
        float m = sin(f * 3.14159);
        p += vec3(sin(aSeed.y * 50. + uTime * .4), cos(aSeed.z * 50. + uTime * .3), sin(aSeed.w * 50. + uTime * .2)) * m * 1.5; // scatter mid-morph
        p *= 1. + (1. - uIntro) * 1.8;
        float hi = mix(1., hl(aIdx.x, uHi.x), w(3., s));
        hi = mix(hi, hl(aIdx.y, uHi.y), w(6., s)); hi = mix(hi, hl(aIdx.z, uHi.z), w(9., s));
        vec3 c = vec3(0.); for (int i = 0; i < ${S}; i++) { c += w(float(i), s) * mix(uCA[i], uCB[i], aSeed.w); }
        vC = c;
        vec4 wp = modelMatrix * vec4(p, 1.);
        vec3 d = wp.xyz - uMouse; float dl = length(d.xy);
        wp.xy += normalize(d.xy + 1e-4) * (1. - smoothstep(0., 1.3, dl)) * .45 * live;              // light parts around the pointer
        vec4 mv = viewMatrix * wp;
        gl_Position = projectionMatrix * mv;
        vA = (.3 + .5 * aSeed.z) * hi * uIntro * uFade * (1. + m * .4);
        gl_PointSize = (1.1 + aSeed.y * 1.9) * (hi > 1.2 ? 1.5 : 1.) * uPR * uScale * (10. / -mv.z);
      }`,
    fragmentShader: `varying vec3 vC; varying float vA; void main(){ float d = length(gl_PointCoord - .5); if (d > .5) discard; float g = smoothstep(.5, 0., d); gl_FragColor = vec4(vC * g, vA * g); }`
  });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; rig.add(pts);

  let W = 0, H = 0, wide = true;
  const resize = () => { W = host.clientWidth; H = host.clientHeight; if (!W || !H) return; renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); wide = W / H > 1.05; U.uScale.value = Math.max(.7, Math.min(1.4, H / 820)); CW.dirty = true; CW.wake(); };
  const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), v2 = new THREE.Vector2(), hit = new THREE.Vector3();
  const render = () => {
    if (CW.covered && !CW.dirty) return;
    const pose = CW.pose(CW.scene.x, CW.time, wide);
    rig.position.set(pose.x, pose.y, 0); rig.scale.setScalar(pose.sc);
    rig.rotation.set(pose.tilt + CW.py.x * .15, pose.rot + CW.px.x * .25, 0);
    U.uScene.value = CW.scene.x; U.uTime.value = CW.time; U.uIntro.value = CW.intro.x; U.uFade.value = CW.fade.x; U.uStill.value = CW.still ? 1 : 0;
    U.uHi.value.set(CW.hi[0], CW.hi[1], CW.hi[2], -1);
    if (CW.pointer && !CW.still) { v2.set(CW.pointer[0] / W * 2 - 1, -(CW.pointer[1] / H) * 2 + 1); ray.setFromCamera(v2, camera); if (ray.ray.intersectPlane(plane, hit)) U.uMouse.value.copy(hit); } else U.uMouse.value.set(99, 99, 0);
    renderer.render(scene, camera);
  };
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);
  CW.has3D = true; window.__webgl = true; document.getElementById('f2d').style.display = 'none';
  new ResizeObserver(resize).observe(host); resize();
  CW.hooks.add(() => { render(); return false; });
  CW.wake();
} catch (err) { CW.has3D = false; }
