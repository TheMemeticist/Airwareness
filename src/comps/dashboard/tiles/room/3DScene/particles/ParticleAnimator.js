import * as THREE from 'three';

export class ParticleAnimator {
  constructor(particleCount) {
    this.particleCount = particleCount;
    
    // Transition states
    this.isTransitioning = false;
    this.transitionStartTime = 0;
    this.transitionDuration = 2000;
    this.fadeInDuration = 2000;
    this.repositionDuration = 50;
    this.pendingDimensions = null;
    this.transitionPhase = 'none'; // 'fadeOut', 'reposition', 'fadeIn', 'none'
    
    // Cache vector for calculations
    this.vec3 = new THREE.Vector3();
    this.speedMultiplier = 1;
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
    const deltaTimeMs = deltaTime; // Keep deltaTime in milliseconds
    const speedFactor = (deltaTime / 16.67) * 0.2;

    // Only update active particles
    for (let i = 0; i < system.activeParticles; i++) {
      const idx = i * 3;
      
      // Update position based on velocity
      system.manager.positions[idx] += system.manager.velocities[idx] * speedFactor;
      system.manager.positions[idx + 1] += system.manager.velocities[idx + 1] * speedFactor;
      system.manager.positions[idx + 2] += system.manager.velocities[idx + 2] * speedFactor;

      this.vec3.set(
        system.manager.positions[idx],
        system.manager.positions[idx + 1],
        system.manager.positions[idx + 2]
      );

      // Decrement lifespan
      system.manager.lifespans[i] -= deltaTimeMs;

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
        const eased = this.easeInOutQuad(1 - progress);
        
        system.particleMaterial.size = system.baseParticleSize * eased;
        system.particleMaterial.opacity = eased;
        
        if (progress >= 1) {
            // Update room dimensions
            system.manager.dimensions = { ...this.pendingDimensions };
            system.manager.clippingPlanes = this.clippingPlanes;
            
            // Clean up all particles and reinitialize with current active count
            const currentActive = system.activeParticles;
            system.manager.initializeParticles();
            
            // Apply current intensity to new particles
            for (let i = currentActive; i < system.manager.particleCount; i++) {
                const idx = i * 3;
                system.manager.positions[idx] = 0;
                system.manager.positions[idx + 1] = -1000;
                system.manager.positions[idx + 2] = 0;
                system.manager.velocities[idx] = 0;
                system.manager.velocities[idx + 1] = 0;
                system.manager.velocities[idx + 2] = 0;
                system.manager.lifespans[i] = 0;
            }
            
            // Move to fade in phase
            this.transitionPhase = 'fadeIn';
            this.transitionStartTime = currentTime;
        }
    } else if (this.transitionPhase === 'fadeIn') {
        const progress = Math.min(elapsed / this.fadeInDuration, 1);
        const eased = this.easeInOutQuad(progress);
        
        system.particleMaterial.size = system.baseParticleSize * eased;
        system.particleMaterial.opacity = eased;

        if (progress >= 1) {
            this.isTransitioning = false;
            this.transitionPhase = 'none';
        }
    }
  }

  // Easing function for transitions
  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
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