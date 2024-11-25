import * as THREE from 'three';
import { ParticleManager } from './ParticleManager';
import { ParticleAnimator } from './ParticleAnimator';

export class ParticleSystem {
  constructor(scene, dimensions) {
    this.scene = scene;
    this.dimensions = dimensions;
    this.particleCount = 2000;
    this.activeParticles = this.particleCount;
    
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
  }

  // Delegate to animator/manager
  animate() {
    if (!this.particles) return;
    this.animator.animate(this);
    this.particleGeometry.attributes.position.needsUpdate = true;
  }

  updateIntensity(intensity) {
    const newParticleCount = Math.floor((intensity / 100) * this.particleCount);
    this.activeParticles = newParticleCount;
    
    // Clear positions of inactive particles through manager
    this.manager.updateIntensity(intensity, this);
  }

  updateRoomBounds(dimensions, clippingPlanes, position) {
    this.animator.startTransition(dimensions, clippingPlanes, position);
  }

  updateQuantaRate(rate) {
    if (!rate || isNaN(rate)) return;
    
    this.quantaRate = rate;
    this.updateParticleCount();
  }

  updateInfectiousCount(count) {
    console.log('ParticleSystem updating infectious count:', count);
    this.infectiousCount = Math.max(1, count);
    this.updateParticleCount();
  }

  updateParticleCount() {
    // Convert quanta per hour to particles per minute
    const particlesPerMinute = this.quantaRate / 60;
    
    // Calculate total particles based on particles per minute and infectious count
    const totalParticles = Math.floor(
      particlesPerMinute * 
      this.infectiousCount * 
      // Scale factor to maintain visual density
      20 // This multiplier can be adjusted based on visual needs
    );
    
    console.log('Calculating new particle count:', {
      quantaRate: this.quantaRate,
      particlesPerMinute: particlesPerMinute,
      infectiousCount: this.infectiousCount,
      totalParticles: totalParticles
    });
    
    // Cap at maximum particle count
    this.activeParticles = Math.min(totalParticles, this.particleCount);
    
    // Convert to intensity percentage for manager
    const intensity = (this.activeParticles / this.particleCount) * 100;
    
    // Update manager with new intensity
    this.manager.updateIntensity(intensity, this);
    
    // Force geometry update
    if (this.particleGeometry) {
      this.particleGeometry.attributes.position.needsUpdate = true;
    }
  }

  calculateLifespan() {
    // Using the decay formula: -ln(2)/λ * ln(1-random)
    // This generates exponentially distributed lifespans
    return -this.baseHalfLife * Math.log(1 - Math.random());
  }

  updateHalfLife(halfLifeHours) {
    if (!halfLifeHours || isNaN(halfLifeHours)) return;
    
    // Convert hours to milliseconds
    this.baseHalfLife = halfLifeHours * 3600000; // 3,600,000 ms = 1 hour
    
    // Update manager's half-life
    if (this.manager) {
      this.manager.baseHalfLife = this.baseHalfLife;
    }
  }
} 