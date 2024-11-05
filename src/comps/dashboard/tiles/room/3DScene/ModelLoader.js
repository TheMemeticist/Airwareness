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
      
      // ONLY adjust light intensity and enable shadows
      model.traverse((child) => {
        if (child.isLight) {
          child.intensity *= 0.05;
          // Configure shadows for each light type
          if (child.shadow) {
            child.shadow.bias = -0.0001;
            child.shadow.normalBias = 0.001;
            child.shadow.mapSize.width = 4096;  // Increased resolution
            child.shadow.mapSize.height = 4096; // Increased resolution
            child.shadow.radius = 4; // Softer shadows
            
            // Adjust shadow camera based on light type
            if (child.isDirectionalLight) {
              child.shadow.camera.near = 0.1;
              child.shadow.camera.far = 100;
              child.shadow.camera.left = -20;
              child.shadow.camera.right = 20;
              child.shadow.camera.top = 20;
              child.shadow.camera.bottom = -20;
            } else if (child.isSpotLight) {
              child.shadow.camera.near = 0.1;
              child.shadow.camera.far = 100;
              child.shadow.camera.fov = 30;
            }
          }
        }
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          // Enhanced material settings for better shadows
          if (child.material) {
            // Handle materials that might be in an array
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            
            materials.forEach(material => {
              material.shadowSide = THREE.BackSide;  // Changed to BackSide for better self-shadowing
              material.side = THREE.DoubleSide;      // Enable double-sided rendering
              
              // If using MeshStandardMaterial
              if (material.isMeshStandardMaterial) {
                material.envMapIntensity = 1.0;
                material.metalness = Math.min(material.metalness, 0.9);
                material.roughness = Math.max(material.roughness, 0.1);
              }
              
              material.needsUpdate = true;
            });
          }
        }
      });

      model.position.set(
        objectPosition.x,
        objectPosition.y,
        objectPosition.z
      );

      scene.add(model);

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
          const roomDimensions = scene.userData.roomDimensions || { width: 10, length: 10, height: 10 };
          
          controls.initialPosition.copy(controls.calculateIdealCameraPosition(roomDimensions));
          
          const t = Math.min(1, (Date.now() - (controls.lastInteraction + controls.returnDelay)) / controls.returnDuration);
          const easeT = t * t * (3 - 2 * t);

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
