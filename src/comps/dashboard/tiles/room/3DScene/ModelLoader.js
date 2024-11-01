import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import sceneModel from './Classroom.glb';

export const loadModel = (scene, camera, controls, renderer, setErrorMessage, objectPosition) => {
  const loader = new GLTFLoader();

  const fov = camera.fov * (Math.PI / 180);
  const center = new THREE.Vector3();
  const sizeBox = new THREE.Vector3();

  loader.load(
    sceneModel,
    (gltf) => {
      const model = gltf.scene;
      
      model.position.set(
        objectPosition.x,
        objectPosition.y,
        objectPosition.z
      );

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
        if (mesh.material) {
          mesh.material.shadowSide = THREE.FrontSide;
          mesh.material.needsUpdate = true;
        }
      });

      lights.forEach(light => {
        light.castShadow = true;
        light.intensity = light.intensity / 10;
        
        if (light.isDirectionalLight) {
          light.shadow.camera.left = -1000;
          light.shadow.camera.right = 1000;
          light.shadow.camera.top = 1000;
          light.shadow.camera.bottom = -1000;
          light.shadow.camera.near = 1;
          light.shadow.camera.far = 2000;
          light.shadow.mapSize.width = 4096;
          light.shadow.mapSize.height = 4096;
          light.shadow.bias = -0.0003;
        }
        
        if (light.shadow) {
          light.shadow.needsUpdate = true;
        }
      });

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

      scene.userData.loadedModel = model;

      const animate = () => {
        if (!model.parent) return;
        requestAnimationFrame(animate);

        if (controls.enableReturn && Date.now() - controls.lastInteraction > controls.returnDelay) {
          const t = Math.min(1, (Date.now() - (controls.lastInteraction + controls.returnDelay)) / controls.returnDuration);
          const easeT = t * t * (3 - 2 * t); // Smooth easing function

          camera.position.lerp(controls.initialPosition, easeT * 0.02);
          controls.target.lerp(center, easeT * 0.02);
        }

        controls.update();
        renderer.render(scene, camera);
      };
      
      controls.initialPosition.copy(camera.position);
      
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

export const updateModelPosition = (scene, position) => {
  const model = scene.userData.loadedModel;
  if (model) {
    model.position.set(position.x, position.y, position.z);
  }
};
