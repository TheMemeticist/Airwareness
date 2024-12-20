import * as THREE from 'three';

export class ParticleManager {
  constructor(particleCount, dimensions, baseHalfLife, system) {
    this.particleCount = particleCount;
    this.dimensions = dimensions;
    this.baseHalfLife = baseHalfLife;
    this.system = system;
    
    // Initialize buffers
    this.positions = new Float32Array(particleCount * 3);
    this.velocities = new Float32Array(particleCount * 3);
    this.lifespans = new Float32Array(particleCount);
    
    this.clippingPlanes = [];
    this.collisionMeshes = [];
    
    this.boundaryMargin = 2.2;
    this.bottomBoundaryMargin = 3.5;
    
    // Reuse vector for bounding/collision logic
    this._tmpVector = new THREE.Vector3();

    this.initializeParticles();
  }

  initializeParticles() {
    this.initializeVelocities();
    this.initializeLifespans();
    this.initializePositions();
  }

  initializeVelocities() {
    const vel = this.velocities;
    for (let i = 0; i < vel.length; i += 3) {
      vel[i]     = (Math.random() - 0.5) * 0.05;
      vel[i + 1] = (Math.random() - 0.5) * 0.05;
      vel[i + 2] = (Math.random() - 0.5) * 0.05;
    }
  }

  initializeLifespans() {
    for (let i = 0; i < this.particleCount; i++) {
      this.lifespans[i] = this.calculateLifespan();
    }
  }

  calculateLifespan() {
    // Base calculation using exponential distribution
    const baseLifespan = -this.baseHalfLife * Math.log(1 - Math.random());
    
    // Return base lifespan without ventilation adjustment
    // (ventilation adjustment will be applied in ParticleSystem)
    return baseLifespan;
  }

  initializePositions() {
    const pos = this.positions;
    const w = this.dimensions.width;
    const h = this.dimensions.height;
    const l = this.dimensions.length;
    const scaleFactor = 4;
    
    const halfW = (w * scaleFactor) / 2;
    const halfH = (h * scaleFactor) / 2;
    const halfL = (l * scaleFactor) / 2;
    
    for (let i = 0; i < pos.length; i += 3) {
      pos[i]     = (Math.random() * w * scaleFactor) - halfW;
      pos[i + 1] = (Math.random() * h * scaleFactor) - halfH;
      pos[i + 2] = (Math.random() * l * scaleFactor) - halfL;
    }
  }

  generateNewParticle(index, options = {}) {
    const idx = index * 3;
    const scaleFactor = 4;
    
    const w = this.dimensions.width;
    const h = this.dimensions.height;
    const l = this.dimensions.length;
    
    const halfW = (w * scaleFactor) / 2;
    const halfH = (h * scaleFactor) / 2;
    const halfL = (l * scaleFactor) / 2;
    
    // Add small random offsets to position
    const jitter = 0.1; // Small position variation
    this.positions[idx]     = (Math.random() * w * scaleFactor) - halfW + (Math.random() - 0.5) * jitter;
    this.positions[idx + 1] = (Math.random() * h * scaleFactor) - halfH + (Math.random() - 0.5) * jitter;
    this.positions[idx + 2] = (Math.random() * l * scaleFactor) - halfL + (Math.random() - 0.5) * jitter;

    // Add more variation to velocity direction and magnitude
    this._tmpVector.set(
      Math.random() - 0.5 + (Math.random() - 0.5) * 0.2, // Add extra randomness
      Math.random() - 0.5 + (Math.random() - 0.5) * 0.2,
      Math.random() - 0.5 + (Math.random() - 0.5) * 0.2
    );
    this._tmpVector.normalize();
    
    // Add slight speed variation (±10%)
    const spd = this.system.getCurrentSpeed() * (0.9 + Math.random() * 0.2);
    
    this.velocities[idx]     = this._tmpVector.x * spd;
    this.velocities[idx + 1] = this._tmpVector.y * spd;
    this.velocities[idx + 2] = this._tmpVector.z * spd;

    // Calculate base lifespan without ventilation effect
    const baseLifespan = this.calculateLifespan();
    this.lifespans[index] = baseLifespan * (0.95 + Math.random() * 0.1); // ±5% variation
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
    
    const pos = this.positions;
    const vel = this.velocities;
    const life = this.lifespans;
    
    // Clear positions of inactive particles
    for (let i = newParticleCount; i < this.particleCount; i++) {
      const idx = i * 3;
      pos[idx] = 0;
      pos[idx + 1] = -1000; // Move them far below the scene
      pos[idx + 2] = 0;
      vel[idx] = vel[idx + 1] = vel[idx + 2] = 0;
      life[i] = 0;
    }
  }

  checkBounds(position) {
    if (!this.clippingPlanes.length) {
      return { inBounds: true };
    }
    
    for (const plane of this.clippingPlanes) {
      const isFloor = plane.normal.y > 0.9;
      const margin = isFloor ? this.bottomBoundaryMargin : this.boundaryMargin;
      
      const distance = plane.distanceToPoint(position) - margin;
      if (distance < 0) {
        return {
          inBounds: false,
          normal: plane.normal,
          distance
        };
      }
    }
    
    return { inBounds: true };
  }

  checkCollisions(position) {
    if (!this.collisionMeshes.length) return false;
    
    // Check each mesh bounding box quickly
    for (const mesh of this.collisionMeshes) {
      // Invert matrix once to localPoint 
      this._tmpVector.copy(position).applyMatrix4(mesh.matrixWorld.invert());
      if (mesh.geometry.boundingBox && mesh.geometry.boundingBox.containsPoint(this._tmpVector)) {
        return true;
      }
    }
    return false;
  }
} 