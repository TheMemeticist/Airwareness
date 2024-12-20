import * as THREE from 'three';

export class ParticleAnimator {
  constructor(particleCount) {
    this.particleCount = particleCount;
    
    // Transition states
    this.isTransitioning = false;
    this.transitionStartTime = 0;
    this.fadeOutDuration = 2000;    // 2 seconds fade out
    this.fadeInDuration = 2000;     // 2 seconds fade in
    this.roomUpdateDelay = 2000;    // 2 seconds wait (total 6 seconds to match room transition)
    this.pendingDimensions = null;
    this.transitionPhase = 'none';  // 'fadeOut', 'waiting', 'fadeIn', 'none'
    
    // Reuse vectors for calculations (avoid creating new ones in loops)
    this.vec3 = new THREE.Vector3();
    this.tmpVel = new THREE.Vector3();
  }

  animate(system) {
    const currentTime = Date.now();
    const deltaTime = currentTime - system.lastUpdateTime;

    // Always update particle positions, even during transition
    this.updateParticles(system, deltaTime);
    
    // Only handle transitions if they are active
    if (this.isTransitioning) {
      this.handleTransition(system, currentTime);
    }
    
    system.lastUpdateTime = currentTime;
  }

  updateParticles(system, deltaTime) {
    const positions = system.manager.positions;
    const velocities = system.manager.velocities;
    const lifespans = system.manager.lifespans;
    const manager = system.manager;
    
    // Use raw deltaTime for movement
    const speedFactor = deltaTime;  
    let activeCount = system.activeParticles;

    // Pre-fetch current system speed for reflection calculations
    const currentSpeed = system.getCurrentSpeed();

    // 1) Decrement lifespans
    for (let i = 0; i < activeCount; i++) {
      lifespans[i] -= deltaTime;
    }

    // 2) Remove or recycle particles that have expired
    let nextAlive = 0;
    for (let i = 0; i < activeCount; i++) {
      if (lifespans[i] > 0) {
        if (i !== nextAlive) {
          // Move data from i to nextAlive
          lifespans[nextAlive] = lifespans[i];
          positions[nextAlive * 3] = positions[i * 3];
          positions[nextAlive * 3 + 1] = positions[i * 3 + 1];
          positions[nextAlive * 3 + 2] = positions[i * 3 + 2];
          velocities[nextAlive * 3] = velocities[i * 3];
          velocities[nextAlive * 3 + 1] = velocities[i * 3 + 1];
          velocities[nextAlive * 3 + 2] = velocities[i * 3 + 2];
        }
        nextAlive++;
      }
      // If lifespan <= 0, particle is effectively removed
      // (we’re just not copying it to the nextAlive slot)
    }

    // Update active count
    activeCount = nextAlive;

    for (let i = 0; i < activeCount; i++) {
      const idx = i * 3;
      
      // Update position using raw deltaTime
      positions[idx]     += velocities[idx]     * speedFactor;
      positions[idx + 1] += velocities[idx + 1] * speedFactor;
      positions[idx + 2] += velocities[idx + 2] * speedFactor;
      
      // Reuse vec3 for position
      this.vec3.set(
        positions[idx],
        positions[idx + 1],
        positions[idx + 2]
      );

      // Handle bounding
      const boundsCheck = manager.checkBounds(this.vec3);
      if (!boundsCheck.inBounds) {
        // Reflect velocity if out of bounds
        if (boundsCheck.normal) {
          const nx = boundsCheck.normal.x;
          const ny = boundsCheck.normal.y;
          const nz = boundsCheck.normal.z;
          
          // Load current velocity into tmpVel
          this.tmpVel.set(
            velocities[idx],
            velocities[idx + 1],
            velocities[idx + 2]
          );

          // Reflect manually: v = v - 2 * (v ⋅ n) * n
          const dot = this.tmpVel.x * nx + this.tmpVel.y * ny + this.tmpVel.z * nz;
          this.tmpVel.x -= 2 * dot * nx;
          this.tmpVel.y -= 2 * dot * ny;
          this.tmpVel.z -= 2 * dot * nz;
          
          // Normalize and multiply by current speed
          const len = Math.sqrt(
            this.tmpVel.x * this.tmpVel.x +
            this.tmpVel.y * this.tmpVel.y +
            this.tmpVel.z * this.tmpVel.z
          );
          if (len > 0) {
            const invLen = 1 / len;
            this.tmpVel.x *= invLen * currentSpeed;
            this.tmpVel.y *= invLen * currentSpeed;
            this.tmpVel.z *= invLen * currentSpeed;
          }

          // Store velocity back
          velocities[idx]     = this.tmpVel.x;
          velocities[idx + 1] = this.tmpVel.y;
          velocities[idx + 2] = this.tmpVel.z;

          // Move particle slightly away from boundary
          positions[idx]     += -boundsCheck.distance * 1.1 * nx;
          positions[idx + 1] += -boundsCheck.distance * 1.1 * ny;
          positions[idx + 2] += -boundsCheck.distance * 1.1 * nz;
        }
      }
      
      // Handle collisions
      if (manager.checkCollisions(this.vec3)) {
        if (i < activeCount - 1) {
          this.swapParticles(manager, i, activeCount - 1);
        }
        activeCount--;
        i--;
      }
    }

    // Update system's active particle count
    system.activeParticles = activeCount;

    // 4) Update geometry so Three.js knows
    //    a) which part of the buffer to render
    //    b) that positions changed
    //
    // NOTE: if your pointer is pSystem.particles, 
    //       pSystem.particles.geometry = pSystem.particleGeometry
    system.particleGeometry.setDrawRange(0, system.activeParticles);
    system.particleGeometry.attributes.position.needsUpdate = true;
    // Optionally update bounding info if needed:
    // system.particleGeometry.computeBoundingSphere();
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
    if (!this.isTransitioning) return;

    const elapsed = currentTime - this.transitionStartTime;
    const material = system.particleMaterial;

    switch (this.transitionPhase) {
      case 'fadeOut':
        {
          const fadeOutProgress = Math.min(1, elapsed / this.fadeOutDuration);
          // Power2.inOut easing
          const eased = fadeOutProgress < 0.5 
            ? 2 * fadeOutProgress * fadeOutProgress 
            : 1 - Math.pow(-2 * fadeOutProgress + 2, 2) / 2;
          material.opacity = 1 - eased;
          
          if (fadeOutProgress >= 1) {
            this.transitionPhase = 'waiting';
            this.transitionStartTime = currentTime;
          }
        }
        break;

      case 'waiting':
        if (elapsed >= this.roomUpdateDelay) {
          if (this.pendingDimensions) {
            system.dimensions = { ...this.pendingDimensions };
            system.manager.dimensions = { ...this.pendingDimensions };
            this.pendingDimensions = null;
          }
          
          this.transitionPhase = 'fadeIn';
          this.transitionStartTime = currentTime;
        }
        break;

      case 'fadeIn':
        {
          const fadeInProgress = Math.min(1, elapsed / this.fadeInDuration);
          // Power2.inOut
          const eased = fadeInProgress < 0.5 
            ? 2 * fadeInProgress * fadeInProgress 
            : 1 - Math.pow(-2 * fadeInProgress + 2, 2) / 2;
          material.opacity = eased;
          
          if (fadeInProgress >= 1) {
            this.isTransitioning = false;
            this.transitionPhase = 'none';
          }
        }
        break;
    }
  }

  startTransition(dimensions, clippingPlanes, position) {
    // Only start a transition if dimensions are changing
    if (this.pendingDimensions) {
      this.isTransitioning = true;
      this.transitionStartTime = Date.now();
      this.transitionPhase = 'fadeOut';
      this.pendingDimensions = dimensions;
      this.clippingPlanes = clippingPlanes;
      this.roomPosition = position;

      // Return promise that resolves after total transition time
      return new Promise((resolve) => {
        const totalDuration = this.fadeOutDuration + this.roomUpdateDelay + this.fadeInDuration;
        setTimeout(resolve, totalDuration);
      });
    }
  }

  calculateParticlesPerFrame(deltaTime) {
    // Kept for interface purposes
    return (this.quantaRate / 3600000) * deltaTime;
  }
} 