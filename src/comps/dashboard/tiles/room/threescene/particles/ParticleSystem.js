import * as THREE from 'three';
import { ParticleManager } from './ParticleManager';
import { ParticleAnimator } from './ParticleAnimator';

export class ParticleSystem {
  constructor(scene, dimensions) {
    this.scene = scene;
    this.dimensions = dimensions;
    this.particleCount = 20000;
    this.activeParticles = 0;
    this.simulationSpeed = 1;
    
    // Core properties
    this.baseSpeed = 2;
    this.baseParticleSize = 0.5;
    
    // Decay rate; 1.0 corresponds to 1-hour half-life
    this.decayRate = 1.0; // per hour
    
    // Define baseHalfLife in milliseconds (1 hour)
    this.baseHalfLife = 3600000; // 3,600,000 ms = 1 hour
    
    // Initialize managers
    this.manager = new ParticleManager(this.particleCount, dimensions, this.baseHalfLife, this);
    this.animator = new ParticleAnimator(this.particleCount);
    
    // Cache frequently used objects
    this.vec3 = new THREE.Vector3();
    this.lastUpdateTime = Date.now();
    
    this.quantaRate = 1;
    
    this.infectiousCount = 1;
    
    this.ventilationRate = 1; // Default ACH value
    
    this.initialize();
    
    // Update particle count based on initial quanta rate
    this.updateParticleCount();
    
    // Calculate base speed to cross room in exactly one hour
    const maxDimension = Math.max(
        dimensions.width,
        dimensions.height,
        dimensions.length
    );
    
    // Base speed to cross room in one hour (units per millisecond)
    this.BASE_SPEED = maxDimension / (3600 * 1000); // Convert to milliseconds
    
    console.log('Particle speed calculations:', {
        maxDimension,
        baseSpeed: this.BASE_SPEED,
        unitsPerSecond: this.BASE_SPEED * 1000,
        timeToTraverseRoom: maxDimension / this.BASE_SPEED, // in milliseconds
    });
    
    this.simulationSpeed = 1; // Default multiplier
    
    // Speed calculation with wider range (from 1x to 100x base speed)
    this.getCurrentSpeed = () => {
        const speedMultiplier = 1 + ((this.simulationSpeed - 1) / 49) * 99; // Maps 1->1 and 50->100
        
        const ventEffect = Math.max(0.001, this.ventilationRate);
        
        return this.BASE_SPEED * speedMultiplier * ventEffect;
    };
    
    // Add storage for original decay rates
    this.originalLifespans = new Float32Array(this.particleCount);
  }

  initialize() {
    this.particleGeometry = new THREE.BufferGeometry();
    this.particleGeometry.setAttribute('position', 
      new THREE.BufferAttribute(this.manager.positions, 3));

    this.particleMaterial = new THREE.PointsMaterial({
      color: 0xFF0000,
      size: this.baseParticleSize,
      sizeAttenuation: true,
      depthWrite: false,
      transparent: true,
      opacity: 1.0,
      blending: THREE.NormalBlending
    });

    this.particles = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.scene.add(this.particles);
  }

  // Core methods
  setCollisionMeshes(model) {
    this.manager.setCollisionMeshes(model);
  }

  setClippingPlanes(planes) {
    this.manager.setClippingPlanes(planes);
  }

  dispose() {
    if (this.particles) {
      this.scene.remove(this.particles);
      this.particleGeometry.dispose();
      this.particleMaterial.dispose();
    }
    
    // Optionally reset active particles
    this.activeParticles = 0;
  }

  // Delegate to animator/manager
  animate() {
    if (!this.particles) return;
    
    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastUpdateTime;
    
    // Calculate and generate new particles
    this.particlesToGenerate = (this.particlesToGenerate || 0) + this.calculateParticlesPerFrame(deltaTime);
    
    // Generate whole particles when we accumulate enough
    while (this.particlesToGenerate >= 1 && this.activeParticles < this.maxActiveParticles) {
      const newParticleIndex = this.activeParticles;
      this.manager.generateNewParticle(newParticleIndex);
      this.activeParticles++;
      this.particlesToGenerate--;
    }
    
    this.animator.animate(this);
    this.particleGeometry.attributes.position.needsUpdate = true;
    
    this.lastUpdateTime = currentTime;
  }

  updateIntensity(intensity) {
    const newParticleCount = Math.floor((intensity / 100) * this.particleCount);
    this.activeParticles = newParticleCount;
    
    // Clear positions of inactive particles through manager
    this.manager.updateIntensity(intensity, this);
  }

  async updateRoomBounds(dimensions, clippingPlanes, position) {
    // Only call startTransition if dimensions are different
    if (JSON.stringify(this.dimensions) !== JSON.stringify(dimensions)) {
        await this.animator.startTransition(dimensions, clippingPlanes, position);
    }

    // Update system properties after transition
    this.dimensions = dimensions;
    this.manager.dimensions = dimensions;
    this.manager.clippingPlanes = clippingPlanes;
  }

  updateQuantaRate(rate) {
    if (!rate || isNaN(rate)) return;
    
    this.quantaRate = rate;
    this.resetParticles();
    this.updateParticleCount();
  }

  updateInfectiousCount(count) {
    console.log('ParticleSystem updating infectious count:', count);
    this.infectiousCount = Math.max(1, count);
    this.resetParticles();
    this.updateParticleCount();
  }

  updateParticleCount() {
    // Convert quanta per hour to particles per minute
    const particlesPerMinute = this.quantaRate / 60;
    
    // Calculate maximum particles based on particles per minute and infectious count
    const maxParticles = Math.floor(
      particlesPerMinute * 
      this.infectiousCount * 
      100 // Scale factor to maintain visual density
    );
    
    // Cap at maximum particle count
    this.maxActiveParticles = 30000;
    
    console.log('Updated particle system limits:', {
      quantaRate: this.quantaRate,
      particlesPerMinute: particlesPerMinute,
      infectiousCount: this.infectiousCount,
      maxParticles: maxParticles,
      maxActiveParticles: this.maxActiveParticles
    });
  }

  calculateLifespan() {
    // Calculate base lifespan without simulation speed adjustment
    const baseLifespan = (-this.baseHalfLife * Math.log(1 - Math.random()));
    
    // ACH directly represents how many times the air is replaced per hour
    // No need to add 1 - the ACH value itself represents the decay rate
    const achEffect = Math.max(0.001, this.ventilationRate);
    
    // Shorter lifespan with higher ACH
    return baseLifespan / achEffect;
  }

  updateHalfLife(halfLifeHours) {
    if (!halfLifeHours || isNaN(halfLifeHours)) return;
    
    this.baseHalfLife = halfLifeHours * 3600000;
    if (this.manager) {
      this.manager.baseHalfLife = this.baseHalfLife;
      this.resetParticles();
    }
  }

  calculateParticlesPerFrame(deltaTime) {
    // Convert quanta per hour to particles per millisecond, adjusted by infectiousCount
    const particlesPerMs = (this.quantaRate * this.infectiousCount) / 3600000;
    
    // Apply ACH reduction for values above 1
    const achEffect = this.ventilationRate > 1 ? (1 / this.ventilationRate) : 1;
    
    // Full scaling for particle generation with ACH effect
    return particlesPerMs * deltaTime * this.simulationSpeed * achEffect;
  }

  resetParticles() {
    // Reset all particles
    this.activeParticles = 0;
    this.particlesToGenerate = 0;
    
    // Clear all particle positions and velocities
    for (let i = 0; i < this.particleCount; i++) {
      const idx = i * 3;
      this.manager.positions[idx] = 0;
      this.manager.positions[idx + 1] = -1000;
      this.manager.positions[idx + 2] = 0;
      this.manager.velocities[idx] = 0;
      this.manager.velocities[idx + 1] = 0;
      this.manager.velocities[idx + 2] = 0;
      this.manager.lifespans[i] = 0;
    }
    
    // Update the geometry
    this.particleGeometry.attributes.position.needsUpdate = true;
  }

  updateSimulationSpeed(speed) {
    this.simulationSpeed = speed;
    const targetSpeed = this.getCurrentSpeed();
    
    // Update velocities for all active particles
    for (let i = 0; i < this.activeParticles; i++) {
      const idx = i * 3;
      const vx = this.manager.velocities[idx];
      const vy = this.manager.velocities[idx + 1];
      const vz = this.manager.velocities[idx + 2];
      
      // Normalize and scale to new speed in one operation
      const length = Math.sqrt(vx * vx + vy * vy + vz * vz);
      if (length > 0) {
        const scale = targetSpeed / length;
        this.manager.velocities[idx] *= scale;
        this.manager.velocities[idx + 1] *= scale;
        this.manager.velocities[idx + 2] *= scale;
      }
    }
  }

  generateNewParticle(index) {
    const newParticleIndex = this.activeParticles;
    this.manager.generateNewParticle(newParticleIndex);
    
    // Store the original lifespan for this particle
    this.originalLifespans[newParticleIndex] = this.manager.lifespans[newParticleIndex];
    
    // Apply current simulation speed to the actual lifespan
    this.manager.lifespans[newParticleIndex] /= this.simulationSpeed;
    
    this.activeParticles++;
  }

  // Add new method to update ventilation rate
  updateVentilationRate(rate) {
    if (!rate || isNaN(rate)) return;
    
    this.ventilationRate = Math.max(0.001, rate);
    
    // Update speeds of existing particles
    const targetSpeed = this.getCurrentSpeed();
    
    // Update velocities and lifespans for all active particles
    for (let i = 0; i < this.activeParticles; i++) {
      const idx = i * 3;
      const vx = this.manager.velocities[idx];
      const vy = this.manager.velocities[idx + 1];
      const vz = this.manager.velocities[idx + 2];
      
      // Normalize and scale to new speed
      const length = Math.sqrt(vx * vx + vy * vy + vz * vz);
      if (length > 0) {
        const scale = targetSpeed / length;
        this.manager.velocities[idx] *= scale;
        this.manager.velocities[idx + 1] *= scale;
        this.manager.velocities[idx + 2] *= scale;
      }
      
      // Use ACH directly for decay rate
      this.manager.lifespans[i] = this.manager.lifespans[i] / this.ventilationRate;
    }
  }
} 