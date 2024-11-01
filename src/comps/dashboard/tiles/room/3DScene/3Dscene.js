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
  const [pivotCorner, setPivotCorner] = useState('topRightFront');
  const [position, setPosition] = useState({ x: 4, y: 4, z: 4 });
  const controlsRef = useRef(null);
  const targetCubeRef = useRef(null);

  const dimensionsInMeters = useMemo(() => ({
    width: isNaN(dimensions.width) ? 1 : dimensions.width * 0.3048,
    length: isNaN(dimensions.length) ? 1 : dimensions.length * 0.3048,
    height: isNaN(dimensions.height) ? 1 : dimensions.height * 0.3048,
  }), [dimensions]);

  useEffect(() => {
    if (!mountRef.current) return;

    const { scene, camera, renderer, controls, targetCube } = setupRendering(
      mountRef.current,
      mountRef.current.clientWidth,
      mountRef.current.clientHeight
    );
    
    targetCubeRef.current = targetCube;
    sceneRef.current = scene;
    controlsRef.current = controls;

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

    updateDimensions(dimensionsInMeters, clippingPlanesRef.current, pivotCorner, position);

    loadModel(scene, camera, controls, renderer, setErrorMessage);

    const handleResize = () => {
      if (!mountRef.current || !renderer) return;

      const { clientWidth: width, clientHeight: height } = mountRef.current;
      
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const animate = () => {
      requestAnimationFrame(animate);
      
      if (targetCubeRef.current && controlsRef.current) {
        // Keep controls target synced with cube position
        controlsRef.current.target.copy(targetCubeRef.current.position);
        controlsRef.current.update();
        
        // Ensure target cube stays visible
        targetCubeRef.current.renderOrder = 999;
        targetCubeRef.current.material.needsUpdate = true;
      }
      
      camera.lookAt(controlsRef.current.target);
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
      updateDimensions(dimensionsInMeters, clippingPlanesRef.current, pivotCorner, position);

      planeHelpersRef.current.forEach((helper) => {
        helper.size = Math.max(dimensionsInMeters.width, dimensionsInMeters.length, dimensionsInMeters.height);
        helper.updateMatrixWorld();
      });
    }
  }, [dimensionsInMeters, pivotCorner, position]);

  const handlePivotChange = (e) => {
    setPivotCorner(e.target.value);
  };

  const handlePositionChange = (axis, value) => {
    setPosition(prev => ({ ...prev, [axis]: parseFloat(value) }));
  };

  return (
    <div className={`${tileStyles['tile-content']} ${styles['three-d-scene-container']}`}>
      {errorMessage ? (
        <div style={{ color: 'red', padding: '20px' }}>
          <p>Error loading 3D model:</p>
          <pre>{errorMessage}</pre>
        </div>
      ) : (
        <>
          <div ref={mountRef} className={styles['3d-scene']}></div>
          <div className={styles['controls']}>
            <select value={pivotCorner} onChange={handlePivotChange}>
              <option value="topLeftFront">Top Left Front</option>
              <option value="topRightFront">Top Right Front</option>
              <option value="bottomLeftFront">Bottom Left Front</option>
              <option value="bottomRightFront">Bottom Right Front</option>
              <option value="topLeftBack">Top Left Back</option>
              <option value="topRightBack">Top Right Back</option>
              <option value="bottomLeftBack">Bottom Left Back</option>
              <option value="bottomRightBack">Bottom Right Back</option>
            </select>
            <div>
              <label>X: <input type="number" value={position.x} onChange={(e) => handlePositionChange('x', e.target.value)} /></label>
              <label>Y: <input type="number" value={position.y} onChange={(e) => handlePositionChange('y', e.target.value)} /></label>
              <label>Z: <input type="number" value={position.z} onChange={(e) => handlePositionChange('z', e.target.value)} /></label>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ThreeDScene;
