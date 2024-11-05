import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene, dimensions) {
    this.scene = scene;
    this.dimensions = dimensions;
    this.particleCount = 2000;
    this.activeParticles = this.particleCount;
    
    // Pre-allocate buffers
    this.velocities = new Float32Array(this.particleCount * 3);
    this.lifespans = new Float32Array(this.particleCount);
    this.positions = null; // Will be set in initialize()
    
    // Constants
    this.baseSpeed = 2;
    this.baseParticleSize = 0.5;
    this.maxLifespan = 10000;
    this.minLifespan = 5000;
    
    // Transition states
    this.isTransitioning = false;
    this.transitionStartTime = 0;
    this.transitionDuration = 1000;
    this.fadeInDuration = 3000;
    this.pendingDimensions = null;

    // Cache frequently used objects
    this.vec3 = new THREE.Vector3();
    this.lastUpdateTime = Date.now();
    
    this.initializeVelocities();
    this.initializeLifespans();
  }

  initializeVelocities() {
    for (let i = 0; i < this.particleCount; i++) {
      this.velocities[i * 3] = (Math.random() - 0.5) * 0.1;     // X velocity
      this.velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.1; // Y velocity
      this.velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1; // Z velocity
    }
  }

  initializeLifespans() {
    for (let i = 0; i < this.particleCount; i++) {
      // Start with random lifespans between min and max
      this.lifespans[i] = this.minLifespan + Math.random() * (this.maxLifespan - this.minLifespan);
    }
  }

  setCollisionMeshes(model) {
    this.collisionMeshes = [];
    model.traverse((child) => {
      if (child.isMesh) {
        this.collisionMeshes.push(child);
      }
    });
  }

  setClippingPlanes(planes) {
    this.clippingPlanes = planes;
  }

  checkBounds(position) {
    if (!this.clippingPlanes) return true;
    
    // Add a small buffer to prevent particles from getting stuck at boundaries
    const BUFFER = 0.1;
    
    // Check if particle is within all clipping planes with buffer
    for (let plane of this.clippingPlanes) {
      const distance = plane.distanceToPoint(position);
      if (distance < BUFFER) {
        return false;
      }
    }
    return true;
  }

  initialize() {
    this.particleGeometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.particleCount * 3);
    
    // Initialize positions using full room dimensions
    for (let i = 0; i < this.particleCount * 3; i += 3) {
      this.positions[i] = (Math.random() * this.dimensions.width) - (this.dimensions.width / 2);
      this.positions[i + 1] = (Math.random() * this.dimensions.height) - (this.dimensions.height / 2);
      this.positions[i + 2] = (Math.random() * this.dimensions.length) - (this.dimensions.length / 2);
    }
    
    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    // Settings for opaque red particles
    this.particleMaterial = new THREE.PointsMaterial({
      color: 0xFF0000,
      size: this.baseParticleSize,
      sizeAttenuation: true,
      depthWrite: true,
      transparent: false,
      opacity: 1.0,
      blending: THREE.NoBlending
    });

    this.particles = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.scene.add(this.particles);
  }

  checkCollision(position, velocity) {
    const direction = new THREE.Vector3(velocity[0], velocity[1], velocity[2]).normalize();
    this.raycaster.set(position, direction);
    
    const intersects = this.raycaster.intersectObjects(this.collisionMeshes);
    if (intersects.length > 0 && intersects[0].distance < 0.1) {
      // Reflect velocity off the surface
      const normal = intersects[0].face.normal;
      const velocityVector = new THREE.Vector3(velocity[0], velocity[1], velocity[2]);
      velocityVector.reflect(normal);
      return [velocityVector.x, velocityVector.y, velocityVector.z];
    }
    return null;
  }

  exciteParticles(intensity = 3, duration = 2000) {
    this.excitementFactor = intensity;
    this.lastExcitementTime = Date.now();
    
    // Give particles an initial velocity boost in random directions
    for (let i = 0; i < this.particleCount * 3; i += 3) {
      this.velocities[i] += (Math.random() - 0.5) * 0.2 * intensity;
      this.velocities[i + 1] += (Math.random() - 0.5) * 0.2 * intensity;
      this.velocities[i + 2] += (Math.random() - 0.5) * 0.2 * intensity;
    }
  }

  animate() {
    if (!this.particles) return;

    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastUpdateTime;

    // Handle transition states first
    if (this.isTransitioning) {
      const transitionTime = currentTime - this.transitionStartTime;
      
      if (transitionTime <= this.transitionDuration) {
        // Scale down
        this.particleMaterial.size = this.baseParticleSize * (1 - transitionTime / this.transitionDuration);
        return;
      } 
      
      if (transitionTime <= this.transitionDuration + this.fadeInDuration) {
        // Only reset once when fully scaled down
        if (this.particleMaterial.size <= 0.01 && this.dimensions !== this.pendingDimensions) {
          this.dimensions = this.pendingDimensions;
          
          // Scale up dimensions by 2 to match room size
          const scaleFactor = 2;
          const bounds = {
            minX: -this.dimensions.width * scaleFactor / 2,
            maxX: this.dimensions.width * scaleFactor / 2,
            minY: -this.dimensions.height * scaleFactor / 2,
            maxY: this.dimensions.height * scaleFactor / 2,
            minZ: -this.dimensions.length * scaleFactor / 2,
            maxZ: this.dimensions.length * scaleFactor / 2
          };

          // Reset all particles with proper initial velocities
          for (let i = 0; i < this.particleCount * 3; i += 3) {
            // Position
            this.positions[i] = bounds.minX + Math.random() * (this.dimensions.width * scaleFactor);
            this.positions[i + 1] = bounds.minY + Math.random() * (this.dimensions.height * scaleFactor);
            this.positions[i + 2] = bounds.minZ + Math.random() * (this.dimensions.length * scaleFactor);
            
            // Initial velocity - ensure significant movement
            const minVelocity = 0.3;
            const maxVelocity = 0.8;
            
            // Generate random velocities between min and max
            this.velocities[i] = (Math.random() * (maxVelocity - minVelocity) + minVelocity) * (Math.random() < 0.5 ? -1 : 1);
            this.velocities[i + 1] = (Math.random() * (maxVelocity - minVelocity) + minVelocity) * (Math.random() < 0.5 ? -1 : 1);
            this.velocities[i + 2] = (Math.random() * (maxVelocity - minVelocity) + minVelocity) * (Math.random() < 0.5 ? -1 : 1);
            
            // Reset lifespans
            this.lifespans[Math.floor(i/3)] = this.minLifespan + Math.random() * (this.maxLifespan - this.minLifespan);
          }
          
          this.particleGeometry.attributes.position.needsUpdate = true;
        }
        
        // Start scaling up only after reset
        const scaleUpProgress = (transitionTime - this.transitionDuration) / this.fadeInDuration;
        this.particleMaterial.size = this.baseParticleSize * scaleUpProgress;
        
      } else {
        // Ensure we end at exactly the base size
        this.isTransitioning = false;
        this.pendingDimensions = null;
        this.particleMaterial.size = this.baseParticleSize;
      }
    }

    const speedFactor = this.baseSpeed * deltaTime * 0.01;

    for (let i = 0; i < this.activeParticles * 3; i += 3) {
      const particleIndex = i / 3;
      
      // Update lifespan and check if particle is dead
      this.lifespans[particleIndex] -= deltaTime;
      if (this.lifespans[particleIndex] <= 0) {
        this.generateNewParticle(particleIndex);
        continue;
      }

      // Calculate fade out during last 500ms of life
      const fadeThreshold = 500;
      if (this.lifespans[particleIndex] < fadeThreshold) {
        const opacity = this.lifespans[particleIndex] / fadeThreshold;
        // If using individual particle colors, you would set it here
      }

      // Update position
      this.positions[i] += this.velocities[i] * speedFactor;
      this.positions[i + 1] += this.velocities[i + 1] * speedFactor;
      this.positions[i + 2] += this.velocities[i + 2] * speedFactor;

      // Boundary check
      this.vec3.set(this.positions[i], this.positions[i + 1], this.positions[i + 2]);
      if (!this.checkBounds(this.vec3)) {
        this.velocities[i] *= -0.8;
        this.velocities[i + 1] *= -0.8;
        this.velocities[i + 2] *= -0.8;
      }

      // Random velocity changes
      this.velocities[i] += (Math.random() - 0.5) * 0.002;
      this.velocities[i + 1] += (Math.random() - 0.5) * 0.002;
      this.velocities[i + 2] += (Math.random() - 0.5) * 0.002;
    }

    this.particleGeometry.attributes.position.needsUpdate = true;
    this.lastUpdateTime = currentTime;
  }

  updateIntensity(intensity) {
    if (!this.particles) return;
    
    const normalizedIntensity = intensity / 100;
    this.particleMaterial.opacity = normalizedIntensity * 0.3;
    
    // Update number of active particles
    const newActiveParticles = Math.floor(this.particleCount * normalizedIntensity);
    const positions = this.particleGeometry.attributes.position.array;
    
    // If reducing particles, move extras far away
    if (newActiveParticles < this.activeParticles) {
      for (let i = newActiveParticles; i < this.activeParticles; i++) {
        positions[i * 3] = 1000000;
        positions[i * 3 + 1] = 1000000;
        positions[i * 3 + 2] = 1000000;
      }
    } 
    // If increasing particles, bring them back into the volume
    else if (newActiveParticles > this.activeParticles) {
      const volumeSize = 20;
      for (let i = this.activeParticles; i < newActiveParticles; i++) {
        positions[i * 3] = (Math.random() - 0.5) * volumeSize;
        positions[i * 3 + 1] = (Math.random() - 0.5) * volumeSize;
        positions[i * 3 + 2] = (Math.random() - 0.5) * volumeSize;
      }
    }
    
    this.activeParticles = newActiveParticles;
    this.particleGeometry.attributes.position.needsUpdate = true;
  }

  updateDimensions(newDimensions) {
    // Validate dimensions before updating
    if (!newDimensions.width || !newDimensions.height || !newDimensions.length) {
      console.warn('Invalid dimensions received:', newDimensions);
      return;
    }

    this.dimensions = { ...newDimensions };
    
    // Immediately reset particles to match new bounds
    this.resetAllParticles();
  }

  dispose() {
    if (this.particles) {
      this.scene.remove(this.particles);
      this.particleGeometry.dispose();
      this.particleMaterial.dispose();
    }
  }

  generateNewParticle(index) {
    const positions = this.particleGeometry.attributes.position.array;
    const idx = index * 3;

    // Use same scale factor as room bounds
    const scaleFactor = 2;
    
    // Generate position within scaled room bounds
    positions[idx] = (Math.random() * this.dimensions.width * scaleFactor) - (this.dimensions.width * scaleFactor / 2);
    positions[idx + 1] = (Math.random() * this.dimensions.height * scaleFactor) - (this.dimensions.height * scaleFactor / 2);
    positions[idx + 2] = (Math.random() * this.dimensions.length * scaleFactor) - (this.dimensions.length * scaleFactor / 2);

    // Use same velocity settings as reset
    const velocityScale = 0.8;
    this.velocities[idx] = (Math.random() - 0.5) * velocityScale;
    this.velocities[idx + 1] = (Math.random() - 0.5) * velocityScale;
    this.velocities[idx + 2] = (Math.random() - 0.5) * velocityScale;

    // Ensure minimum velocity
    if (Math.abs(this.velocities[idx]) < 0.1) this.velocities[idx] += 0.1;
    if (Math.abs(this.velocities[idx + 1]) < 0.1) this.velocities[idx + 1] += 0.1;
    if (Math.abs(this.velocities[idx + 2]) < 0.1) this.velocities[idx + 2] += 0.1;

    // Reset lifespan
    this.lifespans[index] = this.minLifespan + Math.random() * (this.maxLifespan - this.minLifespan);
  }

  resetAllParticles() {
    if (!this.dimensions || !this.positions) return;

    console.log('Resetting particles with dimensions:', this.dimensions); 

    // Reset all particle positions within new dimensions
    for (let i = 0; i < this.particleCount * 3; i += 3) {
      // Ensure particles are within the actual room bounds
      this.positions[i] = Math.random() * this.dimensions.width - (this.dimensions.width / 2);
      this.positions[i + 1] = Math.random() * this.dimensions.height - (this.dimensions.height / 2);
      this.positions[i + 2] = Math.random() * this.dimensions.length - (this.dimensions.length / 2);
      
      // Reset velocities to create initial movement
      const initialBoost = 0.2; // Reduced initial velocity for smoother start
      this.velocities[i] = (Math.random() - 0.5) * initialBoost;
      this.velocities[i + 1] = (Math.random() - 0.5) * initialBoost;
      this.velocities[i + 2] = (Math.random() - 0.5) * initialBoost;
      
      // Reset lifespans
      this.lifespans[Math.floor(i/3)] = this.minLifespan + Math.random() * (this.maxLifespan - this.minLifespan);
    }
    
    this.particleGeometry.attributes.position.needsUpdate = true;
    this.lastUpdateTime = Date.now();
  }

  updateRoomBounds(dimensions, clippingPlanes, position) {
    // Start transition
    this.isTransitioning = true;
    this.transitionStartTime = Date.now();
    this.pendingDimensions = { ...dimensions };

    // Store clipping planes and position
    this.clippingPlanes = clippingPlanes;
    this.roomPosition = { ...position };
  }
} 