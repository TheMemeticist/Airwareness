import * as THREE from 'three';

export class AnimationController {
  constructor(scene, camera, controls, center) {
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.center = center;
    this.isReturning = false;
    this.animationFrame = null;
    this.returnDuration = 2000; // 2 seconds
    this.returnStartTime = null;
    
    // Store initial state
    this.initialCameraPosition = camera.position.clone();
    this.initialTargetPosition = center.clone();
  }

  startAnimation() {
    this.animate();
  }

  stopAnimation() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  animate = () => {
    this.animationFrame = requestAnimationFrame(this.animate);

    if (this.controls.enableReturn && 
        Date.now() - this.controls.lastInteraction > this.controls.returnDelay) {
      
      if (!this.isReturning) {
        // Start return transition
        this.isReturning = true;
        this.returnStartTime = Date.now();
        this.startPosition = this.camera.position.clone();
        this.startTarget = this.controls.target.clone();
      }

      if (this.isReturning) {
        const elapsed = Date.now() - this.returnStartTime;
        const progress = Math.min(elapsed / this.returnDuration, 1);
        const eased = this.easeInOutQuad(progress);

        // Interpolate camera position
        this.camera.position.lerpVectors(
          this.startPosition,
          this.initialCameraPosition,
          eased
        );

        // Interpolate controls target
        this.controls.target.lerpVectors(
          this.startTarget,
          this.initialTargetPosition,
          eased
        );

        if (progress >= 1) {
          this.isReturning = false;
        }
      }
    } else {
      this.isReturning = false;
    }

    this.controls.update();
    this.scene.userData.renderer.render(this.scene, this.camera);
  }
} 