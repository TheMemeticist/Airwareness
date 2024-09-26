import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import styles from '../Room.module.css';
import tileStyles from '../../Tile.module.css';

import { setupRendering } from './RenderingSetup';
import { loadModel } from './ModelLoader';
import { updateDimensions } from './UpdateDimensions';
import clipCubeModel from './ClipCube.glb';

const ThreeDScene = ({ title, dimensions, airflow = 500 }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const wireframeRef = useRef(null);
  const clippingPlanesRef = useRef([]);
  const [errorMessage, setErrorMessage] = useState(null);

  const dimensionsInMeters = useMemo(() => ({
    width: isNaN(dimensions.width) ? 1 : dimensions.width * 0.3048,
    length: isNaN(dimensions.length) ? 1 : dimensions.length * 0.3048,
    height: isNaN(dimensions.height) ? 1 : dimensions.height * 0.3048,
  }), [dimensions]);

  useEffect(() => {
    console.log('ThreeDScene effect running');
    console.log('Dimensions:', dimensions);
    console.log('Dimensions in meters:', dimensionsInMeters);
    if (!mountRef.current) {
      console.error('Mount ref is not available');
      return;
    }

    const { scene, camera, renderer, controls } = setupRendering(mountRef.current);
    sceneRef.current = scene;

    console.log('Creating wireframe');
    const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
    const wireframeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const wireframe = new THREE.LineSegments(
      new THREE.EdgesGeometry(wireframeGeometry),
      wireframeMaterial
    );
    wireframe.name = 'clipCubeWireframe';
    scene.add(wireframe);
    wireframeRef.current = wireframe;
    console.log('Wireframe added to scene:', wireframe);

    console.log('Creating clipping planes');
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
    console.log('Clipping planes created:', planes);

    console.log('Initial update of dimensions');
    updateDimensions(dimensionsInMeters, wireframe, clippingPlanesRef.current);

    console.log('Loading model');
    loadModel(scene, camera, controls, renderer, setErrorMessage, (model) => {
      console.log('Model loaded, adjusting camera');
      const sceneBox = new THREE.Box3().setFromObject(scene);
      const sceneSize = sceneBox.getSize(new THREE.Vector3());
      const sceneCenter = sceneBox.getCenter(new THREE.Vector3());

      const fov = camera.fov * (Math.PI / 180);
      const cameraDistance = Math.max(sceneSize.x, sceneSize.y, sceneSize.z) / (2 * Math.tan(fov / 2));

      camera.position.copy(sceneCenter).add(new THREE.Vector3(0, 0, cameraDistance * 1.5));
      camera.lookAt(sceneCenter);
      controls.target.copy(sceneCenter);
      controls.update();
      console.log('Camera adjusted:', camera.position);
    });

    const handleResize = () => {
      console.log('Handling resize');
      const container = mountRef.current;
      let width = container.clientWidth;
      let height = container.clientHeight;
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
    console.log('Animation loop started');

    return () => {
      console.log('Cleanup function running');
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      controls.dispose();
      window.removeEventListener('resize', handleResize);
      scene.remove(scene.getObjectByName('clipCubeWireframe'));
    };
  }, []);

  useEffect(() => {
    console.log('Dimensions changed:', dimensionsInMeters);
    if (wireframeRef.current && clippingPlanesRef.current.length) {
      updateDimensions(dimensionsInMeters, wireframeRef.current, clippingPlanesRef.current);
    } else {
      console.warn('Wireframe or clipping planes not available for update');
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
