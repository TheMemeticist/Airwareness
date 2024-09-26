import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import sceneModel from './Buildings2.glb';

export const loadModel = (scene, camera, controls, renderer, setErrorMessage, onModelLoaded) => {
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

      if (onModelLoaded) {
        onModelLoaded(model);
      }

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
      console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
    },
    (error) => {
      console.error('Error loading 3D model:', error);
      setErrorMessage(`Error loading 3D model: ${error.message}`);
    }
  );
};
