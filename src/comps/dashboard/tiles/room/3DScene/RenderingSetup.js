import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export const setupRendering = (container, width, height) => {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xffffff, 1, 1000);

  const camera = new THREE.PerspectiveCamera(
    75,
    width / height,
    1,
    750
  );

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
    precision: 'mediump',
    stencil: false,
    depth: true
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.capabilities.maxTextures = 16;
  renderer.capabilities.maxVertexTextures = 16;

  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.25;
  controls.screenSpacePanning = false;
  controls.maxPolarAngle = Math.PI / 2;
  controls.enableZoom = true;
  controls.zoomSpeed = 1.0;
  controls.rotateSpeed = 1.0;
  controls.panSpeed = 1.0;
  controls.update();

  return { scene, camera, renderer, controls };
};
