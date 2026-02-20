import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uAmplitude;
  varying vec2 vUv;
  varying float vElevation;
  varying float vTwist;

  void main() {
    vUv = uv;

    vec3 pos = position;

    // Taper width: narrow at start, wider at end
    float progress = uv.x;
    float taper = 0.25 + 0.75 * progress;
    pos.y *= taper;

    // Twist the ribbon around its long axis (X)
    // Continuous slow rotation + wave-based twist
    float twistAngle = progress * 2.5 + uTime * 0.18 + sin(progress * 3.14 + uTime * 0.3) * 0.4;
    float cosT = cos(twistAngle);
    float sinT = sin(twistAngle);
    float y = pos.y;
    float z = pos.z;
    pos.y = y * cosT - z * sinT;
    pos.z = y * sinT + z * cosT;
    vTwist = sinT;

    // Wave displacement after twist
    float t = uTime * 0.55;
    float wave1 = sin(pos.x * 1.4 + t * 0.5) * 0.3;
    float wave2 = sin(pos.x * 2.8 - t * 0.7 + 1.0) * 0.15;
    float wave3 = sin(pos.x * 0.7 + t * 0.3) * 0.2;

    float ampScale = 0.4 + 0.6 * taper;
    float elevation = (wave1 + wave2 + wave3) * uAmplitude * ampScale;
    pos.z += elevation;
    vElevation = elevation;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColorDeep;
  uniform vec3 uColorMid;
  uniform vec3 uColorLight;
  uniform vec3 uColorAccent;
  uniform vec3 uColorWarm;
  uniform float uOpacity;
  varying vec2 vUv;
  varying float vElevation;
  varying float vTwist;

  void main() {
    float gradientX = vUv.x + sin(uTime * 0.1) * 0.06;
    float mixFactor = smoothstep(0.0, 1.0, gradientX);

    // Twist face: front vs back get different palettes
    float face = vTwist * 0.5 + 0.5;

    // Front: deep -> mid -> warm along length
    vec3 frontColor = mix(uColorDeep, uColorMid, mixFactor);
    frontColor = mix(frontColor, uColorWarm, smoothstep(0.4, 0.85, mixFactor) * 0.5);

    // Back: mid -> light -> accent along length
    vec3 backColor = mix(uColorMid, uColorLight, mixFactor);
    backColor = mix(backColor, uColorAccent, smoothstep(0.3, 0.7, mixFactor) * 0.35);

    vec3 baseColor = mix(frontColor, backColor, face);

    // Elevation highlights
    float elevNorm = smoothstep(-0.4, 0.4, vElevation);
    baseColor = mix(baseColor, uColorLight, elevNorm * 0.3);

    // Warm accent streaks
    float streak = sin(vUv.x * 5.0 + vUv.y * 3.0 + uTime * 0.15) * 0.5 + 0.5;
    streak = smoothstep(0.6, 0.9, streak);
    baseColor = mix(baseColor, uColorAccent, streak * 0.2);

    // Fade ends of the ribbon along its length
    float endFade = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);
    // Soften edges along width
    float edgeFade = smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.92, vUv.y);
    float alpha = uOpacity * edgeFade * endFade;

    gl_FragColor = vec4(baseColor, alpha);
  }
`;

interface WaveColors {
  deep: [number, number, number];
  mid: [number, number, number];
  light: [number, number, number];
  accent: [number, number, number];
  warm: [number, number, number];
}

const LIGHT_COLORS: WaveColors = {
  deep: [0.10, 0.14, 0.38],   // deep indigo
  mid: [0.23, 0.51, 0.96],    // brand blue #3b82f6
  light: [0.56, 0.73, 0.99],  // lighter blue
  accent: [0.85, 0.40, 0.08], // warm amber
  warm: [0.55, 0.22, 0.68],   // violet/purple
};

const DARK_COLORS: WaveColors = {
  deep: [0.06, 0.06, 0.22],
  mid: [0.22, 0.42, 0.85],
  light: [0.42, 0.68, 0.98],
  accent: [0.96, 0.55, 0.12],
  warm: [0.62, 0.28, 0.78],
};

export function WaveCanvas({ isDark = false }: { isDark?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);
  const uniformsRef = useRef<Record<string, THREE.IUniform> | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(1.0, -2.0, 5.0);
    camera.lookAt(0.2, 0.5, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

    const uniforms: Record<string, THREE.IUniform> = {
      uTime: { value: 0 },
      uAmplitude: { value: 0.45 },
      uColorDeep: { value: new THREE.Vector3(...colors.deep) },
      uColorMid: { value: new THREE.Vector3(...colors.mid) },
      uColorLight: { value: new THREE.Vector3(...colors.light) },
      uColorAccent: { value: new THREE.Vector3(...colors.accent) },
      uColorWarm: { value: new THREE.Vector3(...colors.warm) },
      uOpacity: { value: 0.9 },
    };
    uniformsRef.current = uniforms;

    const geometry = new THREE.PlaneGeometry(10, 3.5, 160, 80);
    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI * 0.12;
    mesh.rotation.z = -Math.PI * 0.38;
    mesh.position.set(0.3, 0.5, 0);
    scene.add(mesh);

    const handleResize = () => {
      const { clientWidth: w, clientHeight: h } = container;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    handleResize();

    const observer = new ResizeObserver(handleResize);
    observer.observe(container);

    const clock = new THREE.Clock();
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      uniforms.uTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      observer.disconnect();
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      container.removeChild(renderer.domElement);
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!uniformsRef.current) return;
    const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
    const u = uniformsRef.current;
    (u.uColorDeep.value as THREE.Vector3).set(...colors.deep);
    (u.uColorMid.value as THREE.Vector3).set(...colors.mid);
    (u.uColorLight.value as THREE.Vector3).set(...colors.light);
    (u.uColorAccent.value as THREE.Vector3).set(...colors.accent);
    (u.uColorWarm.value as THREE.Vector3).set(...colors.warm);
  }, [isDark]);

  return (
    <div
      ref={containerRef}
      className="chiron-wave-canvas"
      aria-hidden="true"
    />
  );
}
