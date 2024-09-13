import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import styles from './Room.module.css';
import tileStyles from '../Tile.module.css';
// Import the GLB file
import classroomModel from './classroom.glb';

const ThreeDScene = ({ title, airflow = 500, size = 400 }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (!mountRef.current) return;

    console.log('Setting up scene');

    // Set up scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(size, size);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mountRef.current.appendChild(renderer.domElement);

    console.log('Scene setup complete');

    // Set up OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2;

    console.log('OrbitControls setup complete');

    // Set up lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);

    console.log('Lighting setup complete');

    // Load the GLB model
    const loader = new GLTFLoader();
    
    console.log('Attempting to load model from:', classroomModel);

    loader.load(
      classroomModel,
      (gltf) => {
        console.log('Model loaded successfully:', gltf);
        scene.add(gltf.scene);
        
        // Adjust camera and controls
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        console.log('Model size:', size);
        
        const maxDim = Math.max(size.x, size.y, size.z);
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
        console.error('Error details:', error.stack);
        console.error('GLB URL:', classroomModel);
        setErrorMessage(`Error loading 3D model: ${error.message}\n\nStack: ${error.stack}\n\nGLB URL: ${classroomModel}`);
      }
    );

    sceneRef.current = { scene, camera, renderer, controls };

    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      controls.dispose();
    };
  }, [size]);

  return (
    <div className={`${tileStyles['tile-content']} ${styles['3d-scene-container']}`}>
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