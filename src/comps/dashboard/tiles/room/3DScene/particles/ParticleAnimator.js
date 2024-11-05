import * as THREE from 'three';

export class ParticleAnimator {
  constructor(particleCount) {
    this.particleCount = particleCount;
    
    // Transition states
    this.isTransitioning = false;
    this.transitionStartTime = 0;
    this.transitionDuration = 1000;
    this.fadeInDuration = 3000;
    this.pendingDimensions = null;
    
    // Cache vector for calculations
    this.vec3 = new THREE.Vector3();
  }

  animate(system) {
    const currentTime = Date.now();
    const deltaTime = currentTime - system.lastUpdateTime;

    if (this.isTransitioning) {
      this.handleTransition(system, currentTime);
      return;
    }

    this.updateParticles(system, deltaTime);
    system.lastUpdateTime = currentTime;
  }

  updateParticles(system, deltaTime) {
    const speedFactor = (deltaTime / 16.67) * 0.2; // Added multiplication by 0.2 to slow down

    for (let i = 0; i < system.activeParticles; i++) {
      const idx = i * 3;
      
      // Update position based on velocity
      system.manager.positions[idx] += system.manager.velocities[idx] * speedFactor;
      system.manager.positions[idx + 1] += system.manager.velocities[idx + 1] * speedFactor;
      system.manager.positions[idx + 2] += system.manager.velocities[idx + 2] * speedFactor;

      // Check position using vec3
      this.vec3.set(
        system.manager.positions[idx],
        system.manager.positions[idx + 1],
        system.manager.positions[idx + 2]
      );

      // Update lifespan
      system.manager.lifespans[i] -= deltaTime;

      // Reset particle if it's out of bounds, colliding, or expired
      if (!system.manager.checkBounds(this.vec3) || 
          system.manager.checkCollisions(this.vec3) || 
          system.manager.lifespans[i] <= 0) {
        system.manager.generateNewParticle(i);
      }
    }
  }

  handleTransition(system, currentTime) {
    const elapsed = currentTime - this.transitionStartTime;
    const progress = Math.min(elapsed / this.transitionDuration, 1);

    if (progress >= 1) {
      this.isTransitioning = false;
      system.manager.dimensions = { ...this.pendingDimensions };
      system.manager.clippingPlanes = this.clippingPlanes;
      return;
    }

    // During transition, gradually reset particles
    const particlesToReset = Math.floor(system.activeParticles * progress);
    for (let i = 0; i < particlesToReset; i++) {
      system.manager.generateNewParticle(i);
    }
  }

  startTransition(dimensions, clippingPlanes, position) {
    this.isTransitioning = true;
    this.transitionStartTime = Date.now();
    this.pendingDimensions = { ...dimensions };
    this.clippingPlanes = clippingPlanes;
    this.roomPosition = { ...position };
  }
} 