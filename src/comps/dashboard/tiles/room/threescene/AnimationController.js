import * as THREE from 'three';

export class AnimationController {
  constructor(scene, camera, controls, center, renderer, targetCube) {
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.center = center;
    this.renderer = renderer;
    this.targetCube = targetCube;
    this.isAnimating = false;
    this.frameId = null;
    this.highPriorityAnimation = false;

    if (this.controls) {
      this.controls.calculateIdealCameraPosition = (dimensions) => {
        const maxDimension = Math.max(dimensions.width, dimensions.length);
        const heightFactor = Math.max(1, dimensions.height / maxDimension);
        const distanceMultiplier = 1.2 * heightFactor;
        
        return new THREE.Vector3(
          maxDimension * distanceMultiplier,
          maxDimension * distanceMultiplier * 0.8,
          maxDimension * distanceMultiplier
        );
      };

      if (scene.userData.roomDimensions) {
        const idealPosition = this.controls.calculateIdealCameraPosition(scene.userData.roomDimensions);
        this.camera.position.copy(idealPosition);
      }
    }

    if (this.controls && this.targetCube) {
      this.controls.target.copy(this.targetCube.position);
      this.controls.update();
    }
  }

  animate = () => {
    if (!this.isAnimating) return;
    
    this.frameId = requestAnimationFrame(this.animate);
    
    if (this.highPriorityAnimation) {
      if (this.controls && this.targetCube) {
        this.controls.target.copy(this.targetCube.position);
        this.controls.update();
      }
      
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    } else {
      if (this.controls && this.targetCube) {
        this.controls.target.copy(this.targetCube.position);
      }
      
      if (this.controls) {
        this.controls.update();
      }
      
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    }
  };

  startAnimation() {
    this.isAnimating = true;
    this.animate();
  }

  stopAnimation() {
    this.isAnimating = false;
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
    }
  }

  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  setHighPriority(value) {
    this.highPriorityAnimation = value;
  }
} 