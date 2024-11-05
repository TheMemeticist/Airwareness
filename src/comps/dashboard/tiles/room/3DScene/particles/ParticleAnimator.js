import * as THREE from 'three';

export class ParticleAnimator {
  constructor(particleCount) {
    this.particleCount = particleCount;
    
    // Transition states
    this.isTransitioning = false;
    this.transitionStartTime = 0;
    this.transitionDuration = 2000;
    this.fadeInDuration = 2000;
    this.repositionDuration = 500;
    this.pendingDimensions = null;
    this.transitionPhase = 'none'; // 'fadeOut', 'reposition', 'fadeIn', 'none'
    
    // Cache vector for calculations
    this.vec3 = new THREE.Vector3();
  }

  animate(system) {
    const currentTime = Date.now();
    const deltaTime = currentTime - system.lastUpdateTime;

    // Always update particle positions, even during transition
    this.updateParticles(system, deltaTime);
    
    if (this.isTransitioning) {
      this.handleTransition(system, currentTime);
    }
    
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
    
    if (this.transitionPhase === 'fadeOut') {
      const progress = Math.min(elapsed / this.transitionDuration, 1);
      const size = system.baseParticleSize * (1 - progress);
      system.particleMaterial.size = size;

      if (progress >= 1) {
        // Update room dimensions
        system.manager.dimensions = { ...this.pendingDimensions };
        system.manager.clippingPlanes = this.clippingPlanes;
        
        // Reset ALL particles with new room dimensions
        system.manager.initializeParticles();
        
        this.transitionPhase = 'wait';
        this.transitionStartTime = currentTime;
      }
    } else if (this.transitionPhase === 'wait') {
      const progress = Math.min(elapsed / 1000, 1); // Wait 1 second
      
      if (progress >= 1) {
        this.transitionPhase = 'fadeIn';
        this.transitionStartTime = currentTime;
      }
    } else if (this.transitionPhase === 'fadeIn') {
      const progress = Math.min(elapsed / this.fadeInDuration, 1);
      const size = system.baseParticleSize * progress;
      system.particleMaterial.size = size;

      if (progress >= 1) {
        this.isTransitioning = false;
        this.transitionPhase = 'none';
      }
    }
  }

  startTransition(dimensions, clippingPlanes, position) {
    this.isTransitioning = true;
    this.transitionStartTime = Date.now();
    this.pendingDimensions = { ...dimensions };
    this.clippingPlanes = clippingPlanes;
    this.roomPosition = { ...position };
    this.transitionPhase = 'fadeOut';
  }
} 