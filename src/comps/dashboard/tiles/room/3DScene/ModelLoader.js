import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import sceneModel from './Classroom.glb';

export const loadModel = (scene, camera, controls, renderer, setErrorMessage, onModelLoaded) => {
  const loader = new GLTFLoader();

  const fov = camera.fov * (Math.PI / 180);
  const center = new THREE.Vector3();
  const sizeBox = new THREE.Vector3();

  loader.load(
    sceneModel,
    (gltf) => {
      const model = gltf.scene;

      scene.add(model);

      const meshes = [];
      const lights = [];
      model.traverse((child) => {
        if (child.isMesh) {
          meshes.push(child);
        } else if (child.isLight) {
          lights.push(child);
        }
      });

      meshes.forEach(mesh => {
        mesh.castShadow = mesh.receiveShadow = true;
      });

      lights.forEach(light => {
        light.castShadow = true;
        light.intensity /= 100;
        if (light.shadow) {
          Object.assign(light.shadow.mapSize, { width: 1024, height: 1024 });
          Object.assign(light.shadow.camera, { near: 0.5, far: 50 });
        }
      });

      if (onModelLoaded) onModelLoaded(model);

      const box = new THREE.Box3().setFromObject(model);
      box.getCenter(center);
      box.getSize(sizeBox);

      const maxDim = Math.max(sizeBox.x, sizeBox.y, sizeBox.z);
      const cameraZ = Math.abs(maxDim * 0.6 / Math.tan(fov / 2));

      camera.position.set(
        center.x + cameraZ * 0.4,
        center.y + cameraZ * 0.3,
        center.z + cameraZ * 0.4
      );
      camera.lookAt(center);
      controls.target.copy(center);
      controls.update();

      const animate = () => {
        if (!model.parent) return;
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
