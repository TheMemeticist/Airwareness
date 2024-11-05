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
      
      // Remove existing scene lights first
      scene.traverse((child) => {
        if (child.isLight) {
          scene.remove(child);
        }
      });

      model.position.set(
        objectPosition.x,
        objectPosition.y,
        objectPosition.z
      );

      scene.add(model);

      const meshes = [];
      const lights = [];
      
      // First pass: collect and normalize lights
      model.traverse((child) => {
        if (child.isMesh) {
          meshes.push(child);
          // Enhance material properties
          if (child.material) {
            child.material.roughness = 0.7;  // Slightly less rough for more light play
            child.material.metalness = 0.1;  // Slight metallic feel
            child.material.envMapIntensity = 1.2; // Enhance environment reflections
          }
        } else if (child.isLight) {
          // Enhance each light type
          if (child.isDirectionalLight) {
            child.intensity = 0.8;
            child.color.setHex(0xffffff);
            child.position.set(5, 8, 5);  // Position for dramatic shadows
          } else if (child.isPointLight) {
            child.intensity = 0.6;
            child.distance = 25;
            child.decay = 1.5;  // Less decay for more reach
            child.color.setHex(0xffeeb1);  // Warm color
          } else if (child.isSpotLight) {
            child.intensity = 0.8;
            child.distance = 30;
            child.angle = Math.PI / 3;  // Wider angle
            child.penumbra = 0.3;  // Sharper edges
            child.decay = 1.5;
            child.color.setHex(0xffffff);
          }
          lights.push(child);
        }
      });

      // Enhance materials for better light interaction
      meshes.forEach(mesh => {
        if (mesh.material) {
          mesh.material.roughness = 0.65;
          mesh.material.metalness = 0.15;
          mesh.material.envMapIntensity = 1.5;
          
          // Add subtle emissive glow to certain materials (adjust based on your needs)
          if (mesh.material.name.includes('screen') || mesh.material.name.includes('light')) {
            mesh.material.emissive = new THREE.Color(0xffffff);
            mesh.material.emissiveIntensity = 0.5;
          }
        }
      });

      // Clear existing lights
      lights.forEach(light => model.remove(light));

      // Add key light (main directional light)
      const keyLight = new THREE.DirectionalLight(0xffffff, 1);
      keyLight.position.set(10, 15, 10);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 2048;
      keyLight.shadow.mapSize.height = 2048;
      keyLight.shadow.camera.near = 0.1;
      keyLight.shadow.camera.far = 100;
      keyLight.shadow.bias = -0.001;
      model.add(keyLight);

      // Add fill light
      const fillLight = new THREE.DirectionalLight(0x8899ff, 0.5);
      fillLight.position.set(-10, 5, -10);
      model.add(fillLight);

      // Add rim light for separation
      const rimLight = new THREE.DirectionalLight(0xffffee, 0.7);
      rimLight.position.set(0, -5, -10);
      model.add(rimLight);

      // Add point lights for local illumination
      const pointLight1 = new THREE.PointLight(0xffd2b3, 0.8, 20);
      pointLight1.position.set(5, 5, 5);
      model.add(pointLight1);

      const pointLight2 = new THREE.PointLight(0xb3d2ff, 0.6, 15);
      pointLight2.position.set(-5, 3, -5);
      model.add(pointLight2);

      // Subtle ambient light
      const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
      model.add(ambientLight);

      // Add hemisphere light for sky bounce
      const hemiLight = new THREE.HemisphereLight(0xffeeb1, 0x080820, 0.4);
      model.add(hemiLight);

      // Second pass: check for and remove duplicate lights
      const uniqueLights = new Map();
      lights.forEach(light => {
        const key = `${light.position.x.toFixed(2)},${light.position.y.toFixed(2)},${light.position.z.toFixed(2)}`;
        if (!uniqueLights.has(key)) {
          uniqueLights.set(key, light);
        } else {
          // If duplicate found, keep the one with better settings
          const existing = uniqueLights.get(key);
          if (light.intensity < existing.intensity) {
            model.remove(existing);
            uniqueLights.set(key, light);
          } else {
            model.remove(light);
          }
        }
      });

      // Debug output of final light setup
      console.log('Final light setup:', 
        Array.from(uniqueLights.values()).map(light => ({
          type: light.type,
          position: light.position.toArray(),
          intensity: light.intensity
        }))
      );

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
