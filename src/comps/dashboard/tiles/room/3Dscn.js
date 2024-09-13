import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import styles from './Room.module.css';
import tileStyles from '../Tile.module.css';
// Import the GLTF file
import sceneModel from './Buildings.glb';

const ThreeDScene = ({ title, airflow = 500 }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (!mountRef.current) return;

    console.log('Setting up scene');

    // Get the size of the container
    const container = mountRef.current;
    let width = container.clientWidth;
    let height = container.clientHeight;

    // Set up scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    // Initial renderer setup
    updateRendererSize();
    
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true; // Enable shadow mapping
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Optional: softer shadows
    container.appendChild(renderer.domElement);

    console.log('Scene setup complete');

    // Remove the light setup code here

    // Set up OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2;

    console.log('OrbitControls setup complete');

    // Load the GLTF model
    const loader = new GLTFLoader();

    console.log('Attempting to load model from:', sceneModel);

    loader.load(
      sceneModel,
      (gltf) => {
        console.log('Model loaded successfully:', gltf);
        const model = gltf.scene;
        scene.add(model);
        
        // Enable shadows for all meshes and lights
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
          if (child.isLight) {
            child.castShadow = true;
            // Adjust shadow properties for each light if needed
            if (child.shadow) {
              child.shadow.mapSize.width = 1024;
              child.shadow.mapSize.height = 1024;
              child.shadow.camera.near = 0.5;
              child.shadow.camera.far = 50;
            }
          }
        });

        // Adjust camera and controls
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const sizeBox = box.getSize(new THREE.Vector3());
        
        console.log('Model size:', sizeBox);
        
        const maxDim = Math.max(sizeBox.x, sizeBox.y, sizeBox.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        
        camera.position.set(center.x + cameraZ, center.y + cameraZ / 2, center.z + cameraZ);
        camera.lookAt(center);
        
        controls.target.copy(center);
        controls.update();

        console.log('Camera position:', camera.position);
        console.log('Camera looking at:', center);

        // Animation
        const animate = () => {
          requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        };
        animate();

        console.log('Animation started');
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      },
      (error) => {
        console.error('Error loading 3D model:', error);
        setErrorMessage(`Error loading 3D model: ${error.message}`);
      }
    );

    sceneRef.current = { scene, camera, renderer, controls };

    // Function to update renderer size
    function updateRendererSize() {
      width = container.clientWidth;
      height = container.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    // Handle window resize
    const handleResize = () => {
      updateRendererSize();
    };

    window.addEventListener('resize', handleResize);

    // Initial size update
    handleResize();

    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      controls.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className={`${tileStyles['tile-content']} ${styles['three-d-scene-container']}`}>
      {errorMessage ? (
        <div style={{ color: 'red', padding: '20px' }}>
          <p>Error loading 3D model:</p>
          <pre>{errorMessage}</pre>
        </div>
      ) : (
        <div ref={mountRef} className={styles['3d-scene']}></div>
      )}
    </div>
  );
};

export default ThreeDScene;