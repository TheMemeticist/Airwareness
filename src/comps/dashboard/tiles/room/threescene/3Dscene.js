import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import styles from '../Room.module.css';
import tileStyles from '../../Tile.module.css';

import { setupRendering } from './RenderingSetup';
import { loadModel, updateModelPosition } from './ModelLoader';
import { updateDimensions } from './UpdateDimensions';
import { ParticleSystem } from './particles/ParticleSystem';
import { PerformanceMonitor } from '../../../../../utils/performanceMonitor';
import { AnimationController } from './AnimationController';
import { useAppContext } from '../../../../../context/AppContext';

const ThreeDScene = ({ dimensions, debug = false, simulationSpeed, vacated }) => {
  const { state } = useAppContext();
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const clippingPlanesRef = useRef([]);
  const planeHelpersRef = useRef([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [pivotCorner, setPivotCorner] = useState('topRightFront');
  const [position, setPosition] = useState({ x: 0, y: 2.3, z: 0 });
  const controlsRef = useRef(null);
  const targetCubeRef = useRef(null);
  const [objectPosition, setObjectPosition] = useState({ x: 4.5, y: 3.4, z: 5 });
  const particleSystemRef = useRef(null);
  const performanceMonitorRef = useRef(null);
  const animationControllerRef = useRef(null);
  const resizeTimeoutRef = useRef(null);

  const dimensionsInMeters = useMemo(() => ({
    width: isNaN(dimensions.width) ? 1 : dimensions.width * 1,
    length: isNaN(dimensions.length) ? 1 : dimensions.length * 1,
    height: isNaN(dimensions.height) ? 1 : dimensions.height * 1,
  }), [dimensions]);

  const handleResize = useCallback((camera, renderer, scene) => {
    if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);

    resizeTimeoutRef.current = setTimeout(() => {
      if (!mountRef.current || !renderer) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.render(scene, camera);
    }, 100);
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    if (debug) {
      performanceMonitorRef.current = new PerformanceMonitor();
      performanceMonitorRef.current.attach(mountRef.current);
    }

    const { scene, camera, renderer, controls, targetCube } = setupRendering(
      mountRef.current,
      mountRef.current.clientWidth,
      mountRef.current.clientHeight
    );

    targetCubeRef.current = targetCube;
    sceneRef.current = scene;
    controlsRef.current = controls;

    const planes = [
      new THREE.Plane(new THREE.Vector3(1, 0, 0), dimensionsInMeters.width / -2),   // Left
      new THREE.Plane(new THREE.Vector3(-1, 0, 0), dimensionsInMeters.width / -2),  // Right
      new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),                              // Bottom
      new THREE.Plane(new THREE.Vector3(0, -1, 0), -dimensionsInMeters.height),     // Top
      new THREE.Plane(new THREE.Vector3(0, 0, 1), dimensionsInMeters.length / -2),  // Front
      new THREE.Plane(new THREE.Vector3(0, 0, -1), dimensionsInMeters.length / -2)  // Back
    ];
    clippingPlanesRef.current = planes;
    renderer.clippingPlanes = planes;

    if (debug) {
      const planeHelpers = planes.map((plane) => {
        const helper = new THREE.PlaneHelper(plane, 10, 0xff0000);
        scene.add(helper);
        return helper;
      });
      planeHelpersRef.current = planeHelpers;
    }

    updateDimensions(dimensionsInMeters, clippingPlanesRef.current, pivotCorner, position);

    loadModel(scene, camera, controls, renderer, setErrorMessage, objectPosition);

    try {
      particleSystemRef.current = new ParticleSystem(scene, dimensionsInMeters);
      particleSystemRef.current.setClippingPlanes(clippingPlanesRef.current);
    } catch (error) {
      // Remove console.error('Failed to initialize particle system:', error);
    }

    const center = new THREE.Vector3(
      0,
      dimensionsInMeters.height / 2,
      0
    );
    animationControllerRef.current = new AnimationController(
      scene,
      camera,
      controls,
      center,
      renderer,
      targetCube
    );
    animationControllerRef.current.startAnimation();

    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      if (particleSystemRef.current) {
        try {
          particleSystemRef.current.animate();
        } catch (error) {
          // Remove console.error('Particle animation error:', error);
        }
      }
    };

    animate();

    const resizeObserver = new ResizeObserver(() => {
      handleResize(camera, renderer, scene);
    });

    resizeObserver.observe(mountRef.current);

    return () => {
      if (debug) {
        // Remove all final performance reporting console groups
      }

      cancelAnimationFrame(frameId);
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);

      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      if (controls) controls.dispose();

      if (planeHelpersRef.current.length) {
        planeHelpersRef.current.forEach(helper => scene.remove(helper));
      }

      if (particleSystemRef.current) {
        particleSystemRef.current.dispose();
      }

      if (targetCube) {
        targetCube.geometry.dispose();
        targetCube.material.dispose();
      }

      if (renderer) renderer.dispose();

      if (animationControllerRef.current) {
        animationControllerRef.current.stopAnimation();
      }

      resizeObserver.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (clippingPlanesRef.current.length) {
      if (animationControllerRef.current) {
        animationControllerRef.current.setHighPriority(true);
      }

      updateDimensions(dimensionsInMeters, clippingPlanesRef.current, pivotCorner, position, true);

      setTimeout(() => {
        if (animationControllerRef.current) {
          animationControllerRef.current.setHighPriority(false);
        }
      }, 6000);

      if (debug && planeHelpersRef.current.length) {
        planeHelpersRef.current.forEach((helper) => {
          helper.size = Math.max(
            dimensionsInMeters.width,
            dimensionsInMeters.length,
            dimensionsInMeters.height
          );
          helper.updateMatrixWorld();
        });
      }

      if (particleSystemRef.current) {
        particleSystemRef.current.updateRoomBounds(
          dimensionsInMeters,
          clippingPlanesRef.current,
          position
        );
      }
    }
  }, [dimensionsInMeters, pivotCorner, position, debug]);

  useEffect(() => {
    if (sceneRef.current) {
      updateModelPosition(sceneRef.current, objectPosition);
    }
  }, [objectPosition]);

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.userData.roomDimensions = dimensionsInMeters;

      if (controlsRef.current?.calculateIdealCameraPosition) {
        controlsRef.current.initialPosition.copy(
          controlsRef.current.calculateIdealCameraPosition(dimensionsInMeters)
        );
      }
    }
  }, [dimensionsInMeters]);

  useEffect(() => {
    if (particleSystemRef.current) {
      const pathogenData = state.pathogens?.[state.currentPathogen];
      if (!pathogenData) {
        if (debug) {
          // Remove console.warn('No pathogen data available for:', state.currentPathogen);
        }
        return;
      }
      const quantaRate = pathogenData.quantaRate ?? 25;
      requestAnimationFrame(() => {
        particleSystemRef.current.updateQuantaRate(quantaRate);
      });
    }
  }, [state.currentPathogen, state.pathogens, debug]);

  useEffect(() => {
    if (particleSystemRef.current) {
      const safeInfectiousCount = state.infectiousCount ?? 0;
      if (debug) {
        // Remove console.log('Updating particle system infectious count:', safeInfectiousCount);
      }
      particleSystemRef.current.updateInfectiousCount(safeInfectiousCount);
    }
  }, [state.infectiousCount, debug]);

  useEffect(() => {
    if (particleSystemRef.current && state.particleHalfLife) {
      const safeHalfLife = state.particleHalfLife ?? 1.1;
      particleSystemRef.current.updateHalfLife(safeHalfLife);
    }
  }, [state.particleHalfLife]);

  useEffect(() => {
    if (particleSystemRef.current) {
      particleSystemRef.current.updateSimulationSpeed(simulationSpeed);
      particleSystemRef.current.isTransitioning = false;
    }
  }, [simulationSpeed]);

  useEffect(() => {
    if (particleSystemRef.current) {
      const safeVentilationRate = state.ventilationRate ?? 1;
      particleSystemRef.current.updateVentilationRate(safeVentilationRate);
    }
  }, [state.ventilationRate]);

  useEffect(() => {
    if (particleSystemRef.current) {
      particleSystemRef.current.setVacated(vacated);
    }
  }, [vacated]);

  const handlePivotChange = useCallback((e) => {
    setPivotCorner(e.target.value);
  }, []);

  const handlePositionChange = useCallback((axis, value) => {
    setPosition(prev => ({ ...prev, [axis]: parseFloat(value) }));
  }, []);

  const handleObjectPositionChange = useCallback((axis, value) => {
    setObjectPosition(prev => ({ ...prev, [axis]: parseFloat(value) }));
  }, []);

  return (
    <div className={`${tileStyles['tile-content']} ${styles['three-d-scene-container']}`}>
      {errorMessage ? (
        <div style={{ color: 'red', padding: '20px' }}>
          <p>Error loading 3D model:</p>
          <pre>{errorMessage}</pre>
        </div>
      ) : (
        <>
          {debug && (
            <div className={styles['debug-controls']}>
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
            </div>
          )}
          <div ref={mountRef} className={styles['3d-scene']}></div>
        </>
      )}
    </div>
  );
};

export default ThreeDScene;
