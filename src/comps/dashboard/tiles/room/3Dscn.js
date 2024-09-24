import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import styles from './Room.module.css';
import tileStyles from '../Tile.module.css';
import sceneModel from './Buildings2.glb';

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

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const cubeGeometry = new THREE.BoxGeometry(dimensions.sideLength, dimensions.height, dimensions.sideLength);
    const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    scene.add(cube);
    cubeRef.current = cube;

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

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2;

    const loader = new GLTFLoader();
    loader.load(
      sceneModel,
      (gltf) => {
        const model = gltf.scene;
        scene.add(model);

        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
          if (child.isLight) {
            child.castShadow = true;
            if (child.shadow) {
              child.shadow.mapSize.width = 1024;
              child.shadow.mapSize.height = 1024;
              child.shadow.camera.near = 0.5;
              child.shadow.camera.far = 50;
            }
          }
        });

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const sizeBox = box.getSize(new THREE.Vector3());

        const maxDim = Math.max(sizeBox.x, sizeBox.y, sizeBox.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

        camera.position.set(center.x + cameraZ, center.y + cameraZ / 2, center.z + cameraZ);
        camera.lookAt(center);

        controls.target.copy(center);
        controls.update();

        const animate = () => {
          requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        };
        animate();
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
    if (cubeRef.current) {
      cubeRef.current.geometry.dispose();
      cubeRef.current.geometry = new THREE.BoxGeometry(dimensions.sideLength, dimensions.height, dimensions.sideLength);
    }

    if (clippingPlanesRef.current.length) {
      clippingPlanesRef.current[0].constant = dimensions.sideLength / 2;
      clippingPlanesRef.current[1].constant = dimensions.sideLength / 2;
      clippingPlanesRef.current[2].constant = dimensions.height / 2;
      clippingPlanesRef.current[3].constant = dimensions.height / 2;
      clippingPlanesRef.current[4].constant = dimensions.sideLength / 2;
      clippingPlanesRef.current[5].constant = dimensions.sideLength / 2;
    }
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