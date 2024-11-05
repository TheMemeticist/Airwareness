import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';

export const setupRendering = (container, width, height) => {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    75,
    width / height,
    0.01,
    1000
  );

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
    precision: 'highp',
    stencil: false,
    depth: true
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = true;
  renderer.shadowMap.needsUpdate = true;
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  container.appendChild(renderer.domElement);

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
  
  controls.calculateIdealCameraPosition = (dimensions) => {
    const maxDimension = Math.max(dimensions.width, dimensions.length, dimensions.height);
    
    // Set minimum and maximum distances
    const MIN_DISTANCE = 20;  // Minimum 5 meters from target
    const MAX_DISTANCE = 300; // Maximum 30 meters from target
    
    // Calculate ideal distance based on room size
    let distance = maxDimension * 1.5;
    
    // Clamp the distance between min and max values
    distance = Math.max(MIN_DISTANCE, Math.min(MAX_DISTANCE, distance));
    
    return new THREE.Vector3(
      targetCube.position.x + distance * 0.7,
      targetCube.position.y + distance * 0.5,
      targetCube.position.z + distance * 0.7
    );
  };
  
  controls.initialPosition = controls.calculateIdealCameraPosition({ width: 10, length: 10, height: 10 });

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

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 8, 5);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 4096;
  dirLight.shadow.mapSize.height = 4096;
  dirLight.shadow.camera.near = 0.1;
  dirLight.shadow.camera.far = 100;
  dirLight.shadow.camera.left = -15;
  dirLight.shadow.camera.right = 15;
  dirLight.shadow.camera.top = 15;
  dirLight.shadow.camera.bottom = -15;
  dirLight.shadow.bias = -0.0001;
  dirLight.shadow.normalBias = 0.001;
  dirLight.shadow.radius = 2;
  scene.add(dirLight);

  // Add a helper to visualize the shadow camera (comment out in production)
  // const helper = new THREE.CameraHelper(dirLight.shadow.camera);
  // scene.add(helper);

  return { 
    scene, 
    camera, 
    renderer, 
    controls, 
    targetCube,
    composer  // Add composer to return object
  };
};
