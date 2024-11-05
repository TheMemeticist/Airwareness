import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

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
    precision: 'highp',
    logarithmicDepthBuffer: true,
    stencil: false,
    depth: true
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  // Setup post-processing with adjusted values
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Adjust SSAO settings
  const ssaoPass = new SSAOPass(scene, camera, width, height);
  ssaoPass.kernelRadius = 32;
  ssaoPass.minDistance = 0.001;
  ssaoPass.maxDistance = 0.2;
  composer.addPass(ssaoPass);

  // Reduce bloom effect
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(width, height),
    0.2,
    0.5,
    0.9
  );
  composer.addPass(bloomPass);

  // Enhanced environment mapping
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x444444);
  scene.environment = pmremGenerator.fromScene(envScene).texture;

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

  return { 
    scene, 
    camera, 
    renderer, 
    controls, 
    targetCube,
    composer  // Add composer to return object
  };
};
