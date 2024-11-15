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
    this.maxLifespan = 10000;
    this.minLifespan = 5000;
    
    // Initialize managers
    this.manager = new ParticleManager(this.particleCount, dimensions);
    this.animator = new ParticleAnimator(this.particleCount);
    
    // Cache frequently used objects
    this.vec3 = new THREE.Vector3();
    this.lastUpdateTime = Date.now();
    
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
    this.manager.updateIntensity(intensity, this);
    this.particleGeometry.attributes.position.needsUpdate = true;
  }

  updateRoomBounds(dimensions, clippingPlanes, position) {
    this.animator.startTransition(dimensions, clippingPlanes, position);
  }
} 