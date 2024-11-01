import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export const setupRendering = (container, width, height) => {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xf5f5f5, 100, 1000);

  const camera = new THREE.PerspectiveCamera(
    75,
    width / height,
    1,
    1000
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
  renderer.shadowMap.autoUpdate = true;
  renderer.shadowMap.needsUpdate = true;
  renderer.capabilities.maxTextures = 16;
  renderer.capabilities.maxVertexTextures = 16;

  container.appendChild(renderer.domElement);

  // Create target cube with larger size and more visible appearance
  const targetCubeGeometry = new THREE.BoxGeometry(1, 1, 1);
  const targetCubeMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    wireframe: true,
    wireframeLinewidth: 2,
    depthTest: false,
    depthWrite: false,
    transparent: true,
    opacity: 0.8
  });
  const targetCube = new THREE.Mesh(targetCubeGeometry, targetCubeMaterial);
  targetCube.position.set(-4, -2, -4.5);
  scene.add(targetCube);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(targetCube.position);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 0.3;
  controls.maxDistance = 300;
  controls.enableReturn = true;
  controls.returnDelay = 2000;
  controls.returnDuration = 1000;
  controls.lastInteraction = Date.now();
  controls.initialPosition = new THREE.Vector3(
    targetCube.position.x + 5,
    targetCube.position.y + 5,
    targetCube.position.z + 5
  );

  controls.addEventListener('start', () => {
    controls.lastInteraction = Date.now();
  });

  controls.update();

  camera.position.set(
    targetCube.position.x + 5,
    targetCube.position.y + 5,
    targetCube.position.z + 5
  );
  camera.lookAt(targetCube.position);

  return { scene, camera, renderer, controls, targetCube };
};
