import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import sceneModel from './models/Classroom.glb';

export const loadModel = (scene, camera, controls, renderer, setErrorMessage, objectPosition) => {
  // Enable shadow mapping on the renderer
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;  // Better quality shadows

  const loader = new GLTFLoader();

  const fov = camera.fov * (Math.PI / 180);
  const center = new THREE.Vector3();
  const sizeBox = new THREE.Vector3();

  loader.load(
    sceneModel,
    (gltf) => {
      const model = gltf.scene;
      
      // Modified light and shadow handling
      model.traverse((child) => {
        if (child.isLight) {
          console.log('Found light:', child.type, child);
          
          let newLight;
          const intensity = child.intensity * 0.03;
          const color = child.color;
          const position = child.position.clone();
          const rotation = child.rotation.clone();
          
          if (child.isDirectionalLight) {
            newLight = new THREE.DirectionalLight(color, intensity);
          } else if (child.isSpotLight) {
            newLight = new THREE.SpotLight(color, intensity);
            newLight.angle = child.angle || Math.PI / 4;
            newLight.penumbra = child.penumbra || 0.5;
            newLight.decay = child.decay || 2;
          } else if (child.isPointLight) {
            newLight = new THREE.PointLight(color, intensity);
            newLight.decay = child.decay || 2;
            newLight.distance = child.distance || 0;
          }
          
          if (newLight) {
            newLight.position.copy(position);
            newLight.rotation.copy(rotation);
            newLight.castShadow = true;
            
            // Improved shadow settings
            newLight.shadow.mapSize.width = 1024;  // Increased for better quality
            newLight.shadow.mapSize.height = 1024;
            newLight.shadow.bias = -0.0001;        // Reduced shadow acne
            newLight.shadow.normalBias = 0.001;    // Helps reduce shadow artifacts
            newLight.shadow.radius = 1.5;          // Soft shadows
            newLight.shadow.blurSamples = 8;       // Improved blur quality
            
            if (newLight.isDirectionalLight) {
              // Tighter shadow camera frustum for better shadow resolution
              const shadowCameraSize = 10;
              newLight.shadow.camera.left = -shadowCameraSize;
              newLight.shadow.camera.right = shadowCameraSize;
              newLight.shadow.camera.top = shadowCameraSize;
              newLight.shadow.camera.bottom = -shadowCameraSize;
              newLight.shadow.camera.near = 0.1;
              newLight.shadow.camera.far = 50;
            } else {
              newLight.shadow.camera.near = 0.1;
              newLight.shadow.camera.far = 35;
              if (newLight.isSpotLight) {
                newLight.shadow.camera.fov = 60;
              }
            }
            
            // Create and add a target for directional and spot lights
            if (newLight.isDirectionalLight || newLight.isSpotLight) {
              const target = new THREE.Object3D();
              target.position.set(0, 0, 0);  // Point towards scene center
              scene.add(target);
              newLight.target = target;
            }
            
            child.parent.add(newLight);
            child.parent.remove(child);
          }
        }
        
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          if (child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            
            materials.forEach(material => {
              // Improved material settings for better shadows
              material.shadowSide = THREE.FrontSide;
              material.side = THREE.DoubleSide;
              
              if (material.isMeshStandardMaterial) {
                material.envMapIntensity = 0.7;
                material.metalness = Math.min(material.metalness, 0.8);
                material.roughness = Math.max(material.roughness, 0.2);
                // Ensure proper normal mapping if available
                if (material.normalMap) {
                  material.normalScale.set(1, 1);
                }
              }
            });
          }
        }
      });

      const FEET_TO_METERS = 0.3048;
      const SCALE_FACTOR = 1 / FEET_TO_METERS; // Convert from meters to feet

      // Scale the model
      model.scale.set(SCALE_FACTOR, SCALE_FACTOR, SCALE_FACTOR);

      // Adjust position to account for scale
      model.position.set(
        objectPosition.x * SCALE_FACTOR,
        objectPosition.y * SCALE_FACTOR,
        objectPosition.z * SCALE_FACTOR
      );

      scene.add(model);

      // Get scaled bounds
      const box = new THREE.Box3().setFromObject(model);
      box.getCenter(center);
      box.getSize(sizeBox);

      // Adjust camera position for scaled model
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

      // Add this after model loading to test shadows
      const testLight = new THREE.DirectionalLight(0xffffff, 1);
      testLight.position.set(5, 5, 5);
      testLight.castShadow = true;
      //scene.add(testLight);
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
    const FEET_TO_METERS = 0.3048;
    const SCALE_FACTOR = 1 / FEET_TO_METERS;
    
    model.position.set(
      position.x * SCALE_FACTOR,
      position.y * SCALE_FACTOR,
      position.z * SCALE_FACTOR
    );
  }
};
