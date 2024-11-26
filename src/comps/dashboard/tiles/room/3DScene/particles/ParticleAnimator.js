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
    const deltaTimeMs = deltaTime;
    const speedFactor = (deltaTime / 16.67) * 0.2;

    let activeCount = system.activeParticles;

    for (let i = 0; i < activeCount; i++) {
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

      // Handle expired particles
      if (system.manager.lifespans[i] <= 0) {
        // Move expired particle out of view
        system.manager.positions[idx] = 0;
        system.manager.positions[idx + 1] = -1000;
        system.manager.positions[idx + 2] = 0;
        system.manager.velocities[idx] = 0;
        system.manager.velocities[idx + 1] = 0;
        system.manager.velocities[idx + 2] = 0;
        
        // Swap with last active particle and decrease active count
        if (i < activeCount - 1) {
          this.swapParticles(system.manager, i, activeCount - 1);
        }
        activeCount--;
        i--; // Reprocess this index since we swapped a new particle into it
        continue;
      }

      // Handle bouncing and collisions
      const boundsCheck = system.manager.checkBounds(this.vec3);
      if (!boundsCheck.inBounds) {
        // Reflect velocity off the boundary
        if (boundsCheck.normal) {
          const velocity = new THREE.Vector3(
            system.manager.velocities[idx],
            system.manager.velocities[idx + 1],
            system.manager.velocities[idx + 2]
          );

          // Store original speed
          const originalSpeed = velocity.length();

          // Calculate reflection
          velocity.reflect(boundsCheck.normal);
          
          // Normalize and restore original speed
          velocity.normalize().multiplyScalar(originalSpeed);
          
          // Update velocities
          system.manager.velocities[idx] = velocity.x;
          system.manager.velocities[idx + 1] = velocity.y;
          system.manager.velocities[idx + 2] = velocity.z;

          // Move particle slightly away from boundary to prevent sticking
          this.vec3.addScaledVector(boundsCheck.normal, -boundsCheck.distance * 1.1);
          system.manager.positions[idx] = this.vec3.x;
          system.manager.positions[idx + 1] = this.vec3.y;
          system.manager.positions[idx + 2] = this.vec3.z;
        }
      }
      
      if (system.manager.checkCollisions(this.vec3)) {
        if (i < activeCount - 1) {
          this.swapParticles(system.manager, i, activeCount - 1);
        }
        activeCount--;
        i--;
      }
    }
    
    // Update system's active particle count
    system.activeParticles = activeCount;
  }

  swapParticles(manager, indexA, indexB) {
    const idxA = indexA * 3;
    const idxB = indexB * 3;
    
    // Swap positions
    for (let i = 0; i < 3; i++) {
      [manager.positions[idxA + i], manager.positions[idxB + i]] = 
      [manager.positions[idxB + i], manager.positions[idxA + i]];
      
      [manager.velocities[idxA + i], manager.velocities[idxB + i]] = 
      [manager.velocities[idxB + i], manager.velocities[idxA + i]];
    }
    
    // Swap lifespans
    [manager.lifespans[indexA], manager.lifespans[indexB]] = 
    [manager.lifespans[indexB], manager.lifespans[indexA]];
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

  calculateParticlesPerFrame(deltaTime) {
    // Convert quanta per hour to particles per millisecond
    const particlesPerMs = (this.quantaRate / 3600000);
    
    // Calculate particles to generate this frame
    return particlesPerMs * deltaTime;
  }
} 