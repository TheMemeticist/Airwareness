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
    this.manager = new ParticleManager(this.particleCount, dimensions, this.baseHalfLife);
    this.animator = new ParticleAnimator(this.particleCount);
    
    // Cache frequently used objects
    this.vec3 = new THREE.Vector3();
    this.lastUpdateTime = Date.now();
    
    this.quantaRate = 1;
    
    this.infectiousCount = 1;
    
    this.initialize();
    
    // Update particle count based on initial quanta rate
    this.updateParticleCount();
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
    // Using the decay formula: -ln(2)/λ * ln(1-random)
    // This generates exponentially distributed lifespans
    // Divide by simulationSpeed to make particles decay faster at higher speeds
    return (-this.baseHalfLife * Math.log(1 - Math.random())) / this.simulationSpeed;
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
    // Multiply to increase particle generation rate based on simulation speed
    const partMultiFactor = this.simulationSpeed * 10;
    const particlesPerMs = (this.quantaRate * this.infectiousCount * partMultiFactor) / 3600000;
    
    // Calculate particles to generate this frame
    return particlesPerMs * deltaTime;
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
    const previousSpeed = this.simulationSpeed;
    
    if (speed > previousSpeed) {
        // When speeding up, update existing particle lifespans
        this.simulationSpeed = speed;
        for (let i = 0; i < this.activeParticles; i++) {
            this.manager.lifespans[i] = this.calculateLifespan();
        }
    } else {
        // When slowing down, only update the speed for future particles
        this.simulationSpeed = speed;
    }
  }
} 