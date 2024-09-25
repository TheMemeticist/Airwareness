import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import styles from '../Room.module.css';
import tileStyles from '../../Tile.module.css';

import { setupRendering } from './RenderingSetup';
import { loadModel } from './ModelLoader';
import { updateDimensions } from './UpdateDimensions';

const ThreeDScene = ({ title, dimensions, airflow = 500 }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cubeRef = useRef(null);
  const clippingPlanesRef = useRef([]);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    let width = container.clientWidth;
    let height = container.clientHeight;

    // Setup rendering environment
    const { scene, camera, renderer, controls } = setupRendering(container, width, height);
    sceneRef.current = { scene, camera, renderer, controls };

    // Create cube and add to scene
    const cubeGeometry = new THREE.BoxGeometry(
      dimensions.sideLength,
      dimensions.height,
      dimensions.sideLength
    );
    const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    scene.add(cube);
    cubeRef.current = cube;

    // Setup clipping planes
    const planes = [
      new THREE.Plane(new THREE.Vector3(1, 0, 0), dimensions.sideLength / 2),
      new THREE.Plane(new THREE.Vector3(-1, 0, 0), dimensions.sideLength / 2),
      new THREE.Plane(new THREE.Vector3(0, 1, 0), dimensions.height / 2),
      new THREE.Plane(new THREE.Vector3(0, -1, 0), dimensions.height / 2),
      new THREE.Plane(new THREE.Vector3(0, 0, 1), dimensions.sideLength / 2),
      new THREE.Plane(new THREE.Vector3(0, 0, -1), dimensions.sideLength / 2),
    ];
    clippingPlanesRef.current = planes;
    renderer.clippingPlanes = planes;

    // Load 3D model
    loadModel(scene, camera, controls, renderer, setErrorMessage);

    // Handle window resize
    const handleResize = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      controls.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    updateDimensions(dimensions, cubeRef.current, clippingPlanesRef.current);
  }, [dimensions]);

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
