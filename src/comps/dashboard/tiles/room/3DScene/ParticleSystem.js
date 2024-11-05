import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene, dimensions) {
    this.scene = scene;
    this.dimensions = dimensions;
    this.particles = null;
    this.particleCount = 2000;
    this.particleGeometry = null;
    this.particleMaterial = null;
    this.velocities = new Float32Array(this.particleCount * 3);
    this.raycaster = new THREE.Raycaster();
    this.collisionMeshes = [];
    this.activeParticles = this.particleCount;
    this.clippingPlanes = null;
    this.initializeVelocities();
  }

  initializeVelocities() {
    for (let i = 0; i < this.particleCount; i++) {
      this.velocities[i * 3] = (Math.random() - 0.5) * 0.1;     // X velocity
      this.velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.1; // Y velocity
      this.velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1; // Z velocity
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
    
    // Check if particle is within all clipping planes
    for (let plane of this.clippingPlanes) {
      if (plane.distanceToPoint(position) < 0) {
        return false;
      }
    }
    return true;
  }

  initialize() {
    this.particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    
    // Create a much larger volume of particles
    const volumeSize = 200;
    for (let i = 0; i < this.particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * volumeSize;     // X
      positions[i * 3 + 1] = (Math.random() - 0.5) * volumeSize; // Y
      positions[i * 3 + 2] = (Math.random() - 0.5) * volumeSize; // Z
    }
    
    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.particleMaterial = new THREE.PointsMaterial({
      color: 0xFF0000,
      size: 0.5,
      transparent: false,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
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

  animate() {
    if (!this.particles) return;
    
    const positions = this.particleGeometry.attributes.position.array;
    
    for (let i = 0; i < this.activeParticles; i++) {
      const idx = i * 3;
      
      // Increased random acceleration by 2x
      this.velocities[idx] += (Math.random() - 0.5) * 0.002;     // X
      this.velocities[idx + 1] += (Math.random() - 0.5) * 0.002; // Y
      this.velocities[idx + 2] += (Math.random() - 0.5) * 0.002; // Z
      
      // Reduced damping (was 0.99, now 0.995) for longer movement
      this.velocities[idx] *= 0.995;
      this.velocities[idx + 1] *= 0.995;
      this.velocities[idx + 2] *= 0.995;

      // Calculate new position
      const newPosition = new THREE.Vector3(
        positions[idx] + this.velocities[idx],
        positions[idx + 1] + this.velocities[idx + 1],
        positions[idx + 2] + this.velocities[idx + 2]
      );

      // Check if new position is within bounds
      if (!this.checkBounds(newPosition)) {
        // Reflect velocity off the boundary
        this.velocities[idx] *= -1;
        this.velocities[idx + 1] *= -1;
        this.velocities[idx + 2] *= -1;
        continue;
      }

      // Update position if within bounds
      positions[idx] = newPosition.x;
      positions[idx + 1] = newPosition.y;
      positions[idx + 2] = newPosition.z;
    }
    
    this.particleGeometry.attributes.position.needsUpdate = true;
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
    this.dimensions = newDimensions;
    
    // Redistribute particles within new dimensions
    const positions = this.particleGeometry.attributes.position.array;
    
    for (let i = 0; i < this.particleCount; i++) {
      const idx = i * 3;
      const position = new THREE.Vector3(
        positions[idx],
        positions[idx + 1],
        positions[idx + 2]
      );

      // If particle is outside new bounds, reset its position
      if (!this.checkBounds(position)) {
        positions[idx] = (Math.random() - 0.5) * this.dimensions.width;
        positions[idx + 1] = (Math.random() - 0.5) * this.dimensions.height;
        positions[idx + 2] = (Math.random() - 0.5) * this.dimensions.length;
      }
    }
    
    this.particleGeometry.attributes.position.needsUpdate = true;
  }

  dispose() {
    if (this.particles) {
      this.scene.remove(this.particles);
      this.particleGeometry.dispose();
      this.particleMaterial.dispose();
    }
  }
} 