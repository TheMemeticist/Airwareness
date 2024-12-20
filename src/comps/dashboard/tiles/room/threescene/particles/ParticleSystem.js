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
    
    // Particle geometry and material
    this.initialize();
    
    // Update particle count based on initial quanta rate
    this.updateParticleCount();
    
    // Calculate base speed to cross room in exactly one hour
    const maxDimension = Math.max(dimensions.width, dimensions.height, dimensions.length);
    this.BASE_SPEED = maxDimension / (3600 * 1000); // Convert to ms
    
    this.simulationSpeed = 1; // Default multiplier
    
    // Speed function
    this.getCurrentSpeed = () => {
      const speedMultiplier = 1 + ((this.simulationSpeed - 1) / 49) * 99; 
      const ventEffect = Math.max(0.001, this.ventilationRate);
      return this.BASE_SPEED * speedMultiplier * ventEffect;
    };
    
    // For storing original lifespans if needed
    this.originalLifespans = new Float32Array(this.particleCount);
    
    // New property
    this.isVacated = false;
  }

  initialize() {
    this.particleGeometry = new THREE.BufferGeometry();
    this.particleGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.manager.positions, 3)
    );

    this.particleMaterial = new THREE.PointsMaterial({
      color: 0xff0000,
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
    this.activeParticles = 0;
  }

  animate() {
    if (!this.particles) return;
    
    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastUpdateTime;
    
    // Only create new particles if this.isVacated is false
    if (!this.isVacated) {
      this.particlesToGenerate = (this.particlesToGenerate || 0) + this.calculateParticlesPerFrame(deltaTime);
      
      while (this.particlesToGenerate >= 1 && this.activeParticles < this.maxActiveParticles) {
        this.generateNewParticle(this.activeParticles);
        this.activeParticles++;
        this.particlesToGenerate--;
      }
    }
    
    // Delegate the actual movement/animation
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
    // Only call startTransition if dimensions differ
    if (JSON.stringify(this.dimensions) !== JSON.stringify(dimensions)) {
      await this.animator.startTransition(dimensions, clippingPlanes, position);
    }

    // Update after transition
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
    this.infectiousCount = Math.max(1, count);
    this.resetParticles();
    this.updateParticleCount();
  }

  updateParticleCount() {
    // Particles per minute
    const particlesPerMinute = this.quantaRate / 60;
    const maxParticles = Math.floor(
      particlesPerMinute * this.infectiousCount * 100 // visual scaling
    );
    
    // Keep an upper bound
    this.maxActiveParticles = 30000; 
  }

  calculateLifespan() {
    // Match Wells-Riley model's total removal rate calculation
    const pathogenDecayRate = Math.log(2) / (this.baseHalfLife / 3600000); // Convert ms to hours
    const totalRemovalRate = this.ventilationRate + pathogenDecayRate;
    
    // Use total removal rate for exponential distribution
    return -3600000 * Math.log(1 - Math.random()) / totalRemovalRate; // Convert hours to ms
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
    // Convert quanta/hour to quanta/ms, multiplied by infectiousCount
    let particlesPerMs = (this.quantaRate * this.infectiousCount) / 3600000;
    
    // Return a rate independent of ventilation
    return particlesPerMs * deltaTime * this.simulationSpeed;
  }

  resetParticles() {
    this.activeParticles = 0;
    this.particlesToGenerate = 0;
    
    // Quickly reset all particles
    const pos = this.manager.positions;
    const vel = this.manager.velocities;
    const life = this.manager.lifespans;
    for (let i = 0; i < this.particleCount; i++) {
      const idx = i * 3;
      pos[idx] = 0; 
      pos[idx + 1] = -1000;
      pos[idx + 2] = 0;
      vel[idx] = vel[idx + 1] = vel[idx + 2] = 0;
      life[i] = 0;
    }
    
    // Update geometry
    this.particleGeometry.attributes.position.needsUpdate = true;
  }

  updateSimulationSpeed(speed) {
    const previousSpeed = this.simulationSpeed;
    this.simulationSpeed = speed;
    const speedRatio = previousSpeed / speed;
    
    // Update velocities and lifespans of active particles
    const vel = this.manager.velocities;
    const lifespans = this.manager.lifespans;
    const targetSpeed = this.getCurrentSpeed();
    
    for (let i = 0; i < this.activeParticles; i++) {
        // Update velocities
        const idx = i * 3;
        const vx = vel[idx];
        const vy = vel[idx + 1];
        const vz = vel[idx + 2];
        
        const length = Math.sqrt(vx * vx + vy * vy + vz * vz);
        if (length > 0) {
            const scale = targetSpeed / length;
            vel[idx]     *= scale;
            vel[idx + 1] *= scale;
            vel[idx + 2] *= scale;
        }
        
        // Scale remaining lifespan based on speed change
        lifespans[i] *= speedRatio;
    }
  }

  generateNewParticle(index) {
    const newParticleIndex = this.activeParticles;
    
    // Pass additional randomization factors to the manager
    this.manager.generateNewParticle(newParticleIndex, {
        timeOffset: Date.now() % 1000 / 1000,
        speedVariation: 0.5 + Math.random() * 0.5,
        directionJitter: 0.4
    });
    
    // Store the base lifespan before ventilation adjustment
    const baseLifespan = this.manager.lifespans[newParticleIndex];
    this.originalLifespans[newParticleIndex] = baseLifespan;
    
    // Apply ventilation effect to lifespan
    this.manager.lifespans[newParticleIndex] = baseLifespan / this.ventilationRate;
    
    // Apply simulation speed effect
    const speedVariation = 0.9 + Math.random() * 0.2;
    this.manager.lifespans[newParticleIndex] /= (this.simulationSpeed * speedVariation);
  }

  updateVentilationRate(rate) {
    if (!rate || isNaN(rate)) return;
    
    const previousRate = this.ventilationRate;
    this.ventilationRate = rate; // Remove minimum constraint
    
    // Update velocities & lifespans
    const vel = this.manager.velocities;
    const lifespans = this.manager.lifespans;
    const originalLifespans = this.originalLifespans;
    
    const pathogenDecayRate = Math.log(2) / (this.baseHalfLife / 3600000);
    const previousTotalRate = previousRate + pathogenDecayRate;
    const newTotalRate = this.ventilationRate + pathogenDecayRate;
    
    for (let i = 0; i < this.activeParticles; i++) {
        // Update velocities
        const idx = i * 3;
        const vx = vel[idx];
        const vy = vel[idx + 1];
        const vz = vel[idx + 2];
        
        const length = Math.sqrt(vx * vx + vy * vy + vz * vz);
        if (length > 0) {
            const scale = this.getCurrentSpeed() / length;
            vel[idx]     *= scale;
            vel[idx + 1] *= scale;
            vel[idx + 2] *= scale;
        }
        
        // Adjust lifespan using total removal rates
        const remainingLifespan = lifespans[i];
        const originalLifespan = originalLifespans[i];
        const elapsedFraction = 1 - (remainingLifespan / (originalLifespan * previousTotalRate));
        lifespans[i] = (originalLifespan * newTotalRate) * (1 - elapsedFraction);
    }
  }

  // New setter method to toggle the vacated state
  setVacated(vacated) {
    console.log('ParticleSystem.setVacated:', vacated);
    this.isVacated = vacated;
  }
} 