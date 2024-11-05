import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import styles from '../Room.module.css';
import tileStyles from '../../Tile.module.css';

import { setupRendering } from './RenderingSetup';
import { loadModel, updateModelPosition } from './ModelLoader';
import { updateDimensions } from './UpdateDimensions';
import { ParticleSystem } from './ParticleSystem';

const ThreeDScene = ({ dimensions }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const clippingPlanesRef = useRef([]);
  const planeHelpersRef = useRef([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [pivotCorner, setPivotCorner] = useState('topRightFront');
  const [position, setPosition] = useState({ x: 0, y: 4, z: 0 });
  const controlsRef = useRef(null);
  const targetCubeRef = useRef(null);
  const [objectPosition, setObjectPosition] = useState({ x: 4, y: 3, z: 5 });
  const [particleIntensity, setParticleIntensity] = useState(50);
  const particleSystemRef = useRef(null);

  const dimensionsInMeters = useMemo(() => ({
    width: isNaN(dimensions.width) ? 1 : dimensions.width * 0.3048,
    length: isNaN(dimensions.length) ? 1 : dimensions.length * 0.3048,
    height: isNaN(dimensions.height) ? 1 : dimensions.height * 0.3048,
  }), [dimensions]);

  useEffect(() => {
    if (!mountRef.current) return;

    const { scene, camera, renderer, controls, targetCube, composer } = setupRendering(
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

    loadModel(scene, camera, controls, renderer, setErrorMessage, objectPosition);

    // Initialize particle system
    particleSystemRef.current = new ParticleSystem(scene, dimensionsInMeters);
    particleSystemRef.current.setClippingPlanes(clippingPlanesRef.current);
    particleSystemRef.current.initialize();

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
        controlsRef.current.target.copy(targetCubeRef.current.position);
        controlsRef.current.update();
        targetCubeRef.current.renderOrder = 999;
        targetCubeRef.current.material.needsUpdate = true;
      }
      
      if (particleSystemRef.current) {
        particleSystemRef.current.animate();
      }
      
      camera.lookAt(controlsRef.current.target);
      
      // Force shadow map update when needed
      renderer.shadowMap.needsUpdate = true;
      
      // Use direct renderer instead of composer for better shadow quality
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
      if (particleSystemRef.current) {
        particleSystemRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (clippingPlanesRef.current.length) {
      updateDimensions(dimensionsInMeters, clippingPlanesRef.current, pivotCorner, position);

      // Update particle system dimensions and clipping planes
      if (particleSystemRef.current) {
        particleSystemRef.current.setClippingPlanes(clippingPlanesRef.current);
        particleSystemRef.current.updateDimensions(dimensionsInMeters);
      }

      planeHelpersRef.current.forEach((helper) => {
        helper.size = Math.max(dimensionsInMeters.width, dimensionsInMeters.length, dimensionsInMeters.height);
        helper.updateMatrixWorld();
      });
    }
  }, [dimensionsInMeters, pivotCorner, position]);

  useEffect(() => {
    if (sceneRef.current) {
      updateModelPosition(sceneRef.current, objectPosition);
    }
  }, [objectPosition]);

  useEffect(() => {
    if (sceneRef.current) {
      // Store dimensions in scene's userData
      sceneRef.current.userData.roomDimensions = dimensionsInMeters;
      
      // Update camera's ideal position
      if (controlsRef.current?.calculateIdealCameraPosition) {
        controlsRef.current.initialPosition.copy(
          controlsRef.current.calculateIdealCameraPosition(dimensionsInMeters)
        );
      }
    }
  }, [dimensionsInMeters]);

  useEffect(() => {
    if (particleSystemRef.current) {
      particleSystemRef.current.updateIntensity(particleIntensity);
    }
  }, [particleIntensity]);

  const handlePivotChange = (e) => {
    setPivotCorner(e.target.value);
  };

  const handlePositionChange = (axis, value) => {
    setPosition(prev => ({ ...prev, [axis]: parseFloat(value) }));
  };

  const handleObjectPositionChange = (axis, value) => {
    setObjectPosition(prev => ({ ...prev, [axis]: parseFloat(value) }));
  };

  const handleParticleIntensityChange = (value) => {
    setParticleIntensity(Math.min(100, Math.max(0, parseFloat(value))));
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
              <label>Clipping Position:</label>
              <label>X: <input type="number" value={position.x} onChange={(e) => handlePositionChange('x', e.target.value)} /></label>
              <label>Y: <input type="number" value={position.y} onChange={(e) => handlePositionChange('y', e.target.value)} /></label>
              <label>Z: <input type="number" value={position.z} onChange={(e) => handlePositionChange('z', e.target.value)} /></label>
            </div>
            <div>
              <label>Object Position:</label>
              <label>X: <input type="number" value={objectPosition.x} onChange={(e) => handleObjectPositionChange('x', e.target.value)} /></label>
              <label>Y: <input type="number" value={objectPosition.y} onChange={(e) => handleObjectPositionChange('y', e.target.value)} /></label>
              <label>Z: <input type="number" value={objectPosition.z} onChange={(e) => handleObjectPositionChange('z', e.target.value)} /></label>
            </div>
            <div>
              <label>Particle Intensity:</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={particleIntensity} 
                onChange={(e) => handleParticleIntensityChange(e.target.value)} 
              />
              <span>{particleIntensity}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ThreeDScene;
