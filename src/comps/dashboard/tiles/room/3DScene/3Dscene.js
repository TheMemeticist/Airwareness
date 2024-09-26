import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import styles from '../Room.module.css';
import tileStyles from '../../Tile.module.css';

import { setupRendering } from './RenderingSetup';
import { loadModel } from './ModelLoader';
import { updateDimensions } from './UpdateDimensions';

const ThreeDScene = ({ dimensions }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const clippingPlanesRef = useRef([]);
  const planeHelpersRef = useRef([]);
  const [errorMessage, setErrorMessage] = useState(null);

  const dimensionsInMeters = useMemo(() => ({
    width: isNaN(dimensions.width) ? 1 : dimensions.width * 0.3048,
    length: isNaN(dimensions.length) ? 1 : dimensions.length * 0.3048,
    height: isNaN(dimensions.height) ? 1 : dimensions.height * 0.3048,
  }), [dimensions]);

  useEffect(() => {
    if (!mountRef.current) return;

    const { scene, camera, renderer, controls } = setupRendering(mountRef.current);
    sceneRef.current = scene;

    const planes = [
      new THREE.Plane(new THREE.Vector3(1, 0, 0), 0),
      new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0),
      new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
      new THREE.Plane(new THREE.Vector3(0, -1, 0), 0),
      new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
      new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)
    ];
    clippingPlanesRef.current = planes;
    renderer.clippingPlanes = planes;

    const planeHelpers = planes.map(plane => {
      const helper = new THREE.PlaneHelper(plane, 10, 0xff0000);
      scene.add(helper);
      return helper;
    });
    planeHelpersRef.current = planeHelpers;

    updateDimensions(dimensionsInMeters, clippingPlanesRef.current);

    loadModel(scene, camera, controls, renderer, setErrorMessage);

    const handleResize = () => {
      const { clientWidth: width, clientHeight: height } = mountRef.current;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      controls.dispose();
      window.removeEventListener('resize', handleResize);
      planeHelpersRef.current.forEach(helper => scene.remove(helper));
    };
  }, []);

  useEffect(() => {
    if (clippingPlanesRef.current.length) {
      updateDimensions(dimensionsInMeters, clippingPlanesRef.current);
      
      planeHelpersRef.current.forEach((helper) => {
        helper.size = Math.max(dimensionsInMeters.width, dimensionsInMeters.length, dimensionsInMeters.height);
        helper.updateMatrixWorld();
      });
    }
  }, [dimensionsInMeters]);

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
