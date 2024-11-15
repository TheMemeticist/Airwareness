import * as THREE from 'three';

export class ParticleManager {
  constructor(particleCount, dimensions) {
    this.particleCount = particleCount;
    this.dimensions = dimensions;
    
    // Initialize buffers
    this.positions = new Float32Array(particleCount * 3);
    this.velocities = new Float32Array(particleCount * 3);
    this.lifespans = new Float32Array(particleCount);
    
    // Adjust these values for longer lifespans
    this.minLifespan = 15000;  // 15 seconds
    this.maxLifespan = 30000;  // 30 seconds
    
    this.clippingPlanes = [];
    this.collisionMeshes = [];
    
    this.initializeParticles();
  }

  initializeParticles() {
    this.initializeVelocities();
    this.initializeLifespans();
    this.initializePositions();
  }

  initializeVelocities() {
    for (let i = 0; i < this.particleCount * 3; i += 3) {
      this.velocities[i] = (Math.random() - 0.5) * 0.1;
      this.velocities[i + 1] = (Math.random() - 0.5) * 0.1;
      this.velocities[i + 2] = (Math.random() - 0.5) * 0.1;
    }
  }

  initializeLifespans() {
    for (let i = 0; i < this.particleCount; i++) {
      this.lifespans[i] = this.minLifespan + Math.random() * (this.maxLifespan - this.minLifespan);
    }
  }

  initializePositions() {
    const scaleFactor = 4;
    for (let i = 0; i < this.particleCount * 3; i += 3) {
      this.positions[i] = (Math.random() * this.dimensions.width * scaleFactor) - (this.dimensions.width * scaleFactor / 2);
      this.positions[i + 1] = (Math.random() * this.dimensions.height * scaleFactor) - (this.dimensions.height * scaleFactor / 2);
      this.positions[i + 2] = (Math.random() * this.dimensions.length * scaleFactor) - (this.dimensions.length * scaleFactor / 2);
    }
  }

  generateNewParticle(index) {
    const idx = index * 3;
    const scaleFactor = 4;
    
    this.positions[idx] = (Math.random() * this.dimensions.width * scaleFactor) - (this.dimensions.width * scaleFactor / 2);
    this.positions[idx + 1] = (Math.random() * this.dimensions.height * scaleFactor) - (this.dimensions.height * scaleFactor / 2);
    this.positions[idx + 2] = (Math.random() * this.dimensions.length * scaleFactor) - (this.dimensions.length * scaleFactor / 2);

    // Reduce velocity scale for slower movement
    const velocityScale = 0.16; // Reduced from 0.8
    this.velocities[idx] = (Math.random() - 0.5) * velocityScale;
    this.velocities[idx + 1] = (Math.random() - 0.5) * velocityScale;
    this.velocities[idx + 2] = (Math.random() - 0.5) * velocityScale;

    // Ensure minimum velocity (also reduced)
    const minVelocity = 0.02; // Reduced from 0.1
    if (Math.abs(this.velocities[idx]) < minVelocity) this.velocities[idx] += minVelocity;
    if (Math.abs(this.velocities[idx + 1]) < minVelocity) this.velocities[idx + 1] += minVelocity;
    if (Math.abs(this.velocities[idx + 2]) < minVelocity) this.velocities[idx + 2] += minVelocity;

    this.lifespans[index] = this.minLifespan + Math.random() * (this.maxLifespan - this.minLifespan);
  }

  setClippingPlanes(planes) {
    this.clippingPlanes = planes;
  }

  setCollisionMeshes(meshes) {
    this.collisionMeshes = Array.isArray(meshes) ? meshes : [meshes];
  }

  updateIntensity(intensity, system) {
    const newParticleCount = Math.floor((intensity / 100) * this.particleCount);
    system.activeParticles = newParticleCount;
    
    // Clear positions of inactive particles
    for (let i = newParticleCount; i < this.particleCount; i++) {
        const idx = i * 3;
        this.positions[idx] = 0;
        this.positions[idx + 1] = -1000; // Move them far below the scene
        this.positions[idx + 2] = 0;
        this.velocities[idx] = 0;
        this.velocities[idx + 1] = 0;
        this.velocities[idx + 2] = 0;
        this.lifespans[i] = 0;
    }
  }

  checkBounds(position) {
    if (!this.clippingPlanes.length) return true;
    
    return this.clippingPlanes.every(plane => {
      const distance = plane.distanceToPoint(position);
      return distance >= 0;
    });
  }

  checkCollisions(position) {
    if (!this.collisionMeshes.length) return false;
    
    const point = new THREE.Vector3(position.x, position.y, position.z);
    return this.collisionMeshes.some(mesh => {
      const localPoint = point.clone().applyMatrix4(mesh.matrixWorld.invert());
      return mesh.geometry.boundingBox.containsPoint(localPoint);
    });
  }

  // ... other utility methods for particle management
} 