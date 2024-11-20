import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import styles from '../Room.module.css';
import tileStyles from '../../Tile.module.css';

import { setupRendering } from './RenderingSetup';
import { loadModel, updateModelPosition } from './ModelLoader';
import { updateDimensions } from './UpdateDimensions';
import { ParticleSystem } from './particles/ParticleSystem';
import { PerformanceMonitor } from '../../../../../utils/performanceMonitor';
import { AnimationController } from './AnimationController';

const ThreeDScene = ({ dimensions, debug = true }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const clippingPlanesRef = useRef([]);
  const planeHelpersRef = useRef([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [pivotCorner, setPivotCorner] = useState('topRightFront');
  const [position, setPosition] = useState({ x: 0, y: 4, z: 0 });
  const controlsRef = useRef(null);
  const targetCubeRef = useRef(null);
  const [objectPosition, setObjectPosition] = useState({ x: 4.5, y: 4.4, z: 5 });
  const [particleIntensity, setParticleIntensity] = useState(50);
  const particleSystemRef = useRef(null);
  const performanceMonitorRef = useRef(null);
  const animationControllerRef = useRef(null);

  const dimensionsInMeters = useMemo(() => ({
    width: isNaN(dimensions.width) ? 1 : dimensions.width * 1,
    length: isNaN(dimensions.length) ? 1 : dimensions.length * 1,
    height: isNaN(dimensions.height) ? 1 : dimensions.height * 1,
  }), [dimensions]);

  useEffect(() => {
    if (!mountRef.current) return;

    // Only initialize performance monitoring in debug mode
    if (debug) {
      console.log('Initializing 3D Scene - Starting Performance Monitoring');
      performanceMonitorRef.current = new PerformanceMonitor();
      performanceMonitorRef.current.attach(mountRef.current);

      // Log initial setup metrics
      console.group('3D Scene Setup Metrics');
      console.log('Window Dimensions:', {
        width: mountRef.current.clientWidth,
        height: mountRef.current.clientHeight
      });
      console.log('Room Dimensions (meters):', dimensionsInMeters);
      console.groupEnd();
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
      new THREE.Plane(new THREE.Vector3(1, 0, 0), dimensionsInMeters.width/-2),  // Left
      new THREE.Plane(new THREE.Vector3(-1, 0, 0), dimensionsInMeters.width/-2), // Right
      new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),                            // Bottom
      new THREE.Plane(new THREE.Vector3(0, -1, 0), -dimensionsInMeters.height),  // Top
      new THREE.Plane(new THREE.Vector3(0, 0, 1), dimensionsInMeters.length/-2), // Front
      new THREE.Plane(new THREE.Vector3(0, 0, -1), dimensionsInMeters.length/-2) // Back
    ];
    clippingPlanesRef.current = planes;
    renderer.clippingPlanes = planes;

    if (debug) {
      const planeHelpers = planes.map(plane => {
        const helper = new THREE.PlaneHelper(plane, 10, 0xff0000);
        scene.add(helper);
        return helper;
      });
      planeHelpersRef.current = planeHelpers;
    }

    updateDimensions(dimensionsInMeters, clippingPlanesRef.current, pivotCorner, position);

    loadModel(scene, camera, controls, renderer, setErrorMessage, objectPosition);

    // Updated particle system initialization
    try {
      particleSystemRef.current = new ParticleSystem(scene, dimensionsInMeters);
      particleSystemRef.current.setClippingPlanes(clippingPlanesRef.current);
    } catch (error) {
      console.error('Failed to initialize particle system:', error);
    }

    // Initialize animation controller with scene center
    const center = new THREE.Vector3(
      0,                              // Centered on X
      dimensionsInMeters.height / 2,  // Half height from bottom
      0                               // Centered on Z
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

    // Remove the existing animation loop and replace with:
    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      // Only monitor performance if in debug mode
      if (debug && performanceMonitorRef.current) {
        const startTime = performanceMonitorRef.current.start();
        
        if (particleSystemRef.current) {
          try {
            particleSystemRef.current.animate();
          } catch (error) {
            console.error('Particle animation error:', error);
          }
        }
        
        performanceMonitorRef.current.end(startTime);
      } else {
        // Regular animation without performance monitoring
        if (particleSystemRef.current) {
          try {
            particleSystemRef.current.animate();
          } catch (error) {
            console.error('Particle animation error:', error);
          }
        }
      }
    };
    
    animate();

    // Optimize resize handler
    let resizeTimeout;
    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      
      resizeTimeout = setTimeout(() => {
        if (!mountRef.current || !renderer) return;

        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }, 250); // Debounce resize events
    };

    window.addEventListener('resize', handleResize);

    // Only set up performance logging interval if in debug mode
    let performanceLoggingInterval;
    if (debug) {
      performanceLoggingInterval = setInterval(() => {
        if (performanceMonitorRef.current) {
          console.group('3D Scene Performance Update');
          const metrics = performanceMonitorRef.current.getAverageMetrics();
          console.log('Performance Metrics:', {
            fps: metrics.averageFPS + ' FPS',
            renderTime: metrics.averageRenderTime + ' ms',
            memoryUsage: metrics.averageMemory + ' MB',
            sampleSize: metrics.samples
          });
          
          // Log additional scene stats
          if (sceneRef.current) {
            console.log('Scene Statistics:', {
              objects: sceneRef.current.children.length,
              geometries: renderer.info.memory.geometries,
              textures: renderer.info.memory.textures,
              triangles: renderer.info.render.triangles
            });
          }
          console.groupEnd();
        }
      }, 5000);
    }

    return () => {
      // Debug-specific cleanup
      if (debug) {
        clearInterval(performanceLoggingInterval);
        if (performanceMonitorRef.current) {
          console.group('3D Scene Final Performance Report');
          performanceMonitorRef.current.logMetrics();
          console.log('Final Renderer Statistics:', {
            geometries: renderer.info.memory.geometries,
            textures: renderer.info.memory.textures,
            triangles: renderer.info.render.triangles,
            calls: renderer.info.render.calls
          });
          console.groupEnd();
          performanceMonitorRef.current.detach();
        }
      }

      // Always perform these cleanup operations
      cancelAnimationFrame(frameId);
      if (resizeTimeout) clearTimeout(resizeTimeout);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      if (controls) controls.dispose();
      window.removeEventListener('resize', handleResize);
      
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
    };
  }, []);

  useEffect(() => {
    if (clippingPlanesRef.current.length) {
      updateDimensions(dimensionsInMeters, clippingPlanesRef.current, pivotCorner, position, true);

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

      // Simplified particle system update
      if (particleSystemRef.current) {
        particleSystemRef.current.updateRoomBounds(
          dimensionsInMeters,
          clippingPlanesRef.current,
          position
        );
      }
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

  // Simplified particle intensity update
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
          {debug && (
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
          )}
        </>
      )}
    </div>
  );
};

export default ThreeDScene;
