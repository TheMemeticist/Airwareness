import * as THREE from 'three';
import gsap from 'gsap';

const TRANSITION_DURATION = 2.0; // 2 seconds to match camera transition

export const updateDimensions = (dimensions, clippingPlanes, pivotCorner = 'topLeftFront', position = { x: 0, y: 0, z: 0 }) => {
  console.log('UpdateDimensions called with:', { dimensions, clippingPlanes, pivotCorner, position });

  const width = isNaN(dimensions.width) ? 1 : dimensions.width;
  const length = isNaN(dimensions.length) ? 1 : dimensions.length;
  const height = isNaN(dimensions.height) ? 1 : dimensions.height;

  if (clippingPlanes && clippingPlanes.length === 6) {
    // Determine offsets based on pivot corner
    let xOffset, yOffset, zOffset;
    switch (pivotCorner) {
      case 'bottomLeftBack':
        xOffset = width; yOffset = height; zOffset = length;
        break;
      case 'bottomRightBack':
        xOffset = 0; yOffset = height; zOffset = length;
        break;
      case 'topLeftBack':
        xOffset = width; yOffset = 0; zOffset = length;
        break;
      case 'topRightBack':
        xOffset = 0; yOffset = 0; zOffset = length;
        break;
      case 'bottomLeftFront':
        xOffset = width; yOffset = height; zOffset = 0;
        break;
      case 'bottomRightFront':
        xOffset = 0; yOffset = height; zOffset = 0;
        break;
      case 'topLeftFront':
        xOffset = width; yOffset = 0; zOffset = 0;
        break;
      case 'topRightFront':
        xOffset = 0; yOffset = 0; zOffset = 0;
        break;
      default:
        console.warn('Invalid pivot corner specified, defaulting to topLeftFront');
        xOffset = width; yOffset = 0; zOffset = 0;
    }

    // Calculate target constants
    const targetValues = [
      xOffset + position.x,
      width - xOffset + position.x,
      yOffset + position.y,
      height - yOffset + position.y,
      zOffset + position.z,
      length - zOffset + position.z
    ];

    // Store initial values
    const initialValues = clippingPlanes.map(plane => plane.constant);

    // Create animation object
    const animationObject = {
      progress: 0,
      update: function() {
        clippingPlanes.forEach((plane, index) => {
          const start = initialValues[index];
          const end = targetValues[index];
          plane.constant = start + (end - start) * this.progress;
        });
      }
    };

    // Kill any existing transitions
    gsap.killTweensOf(animationObject);

    // Animate to new values
    gsap.to(animationObject, {
      progress: 1,
      duration: TRANSITION_DURATION,
      ease: "power2.inOut",
      onUpdate: () => animationObject.update()
    });

  } else {
    console.warn('Clipping planes not available or incorrect number');
  }
};

// Alternative version without GSAP (if you prefer not to use external libraries):
export const updateDimensionsWithoutGSAP = (dimensions, clippingPlanes, pivotCorner = 'topLeftFront', position = { x: 0, y: 0, z: 0 }) => {
  console.log('UpdateDimensions called with:', { dimensions, clippingPlanes, pivotCorner, position });

  const width = isNaN(dimensions.width) ? 1 : dimensions.width;
  const length = isNaN(dimensions.length) ? 1 : dimensions.length;
  const height = isNaN(dimensions.height) ? 1 : dimensions.height;

  if (clippingPlanes && clippingPlanes.length === 6) {
    // Determine offsets based on pivot corner
    let xOffset, yOffset, zOffset;
    switch (pivotCorner) {
      case 'bottomLeftBack':
        xOffset = width; yOffset = height; zOffset = length;
        break;
      case 'bottomRightBack':
        xOffset = 0; yOffset = height; zOffset = length;
        break;
      case 'topLeftBack':
        xOffset = width; yOffset = 0; zOffset = length;
        break;
      case 'topRightBack':
        xOffset = 0; yOffset = 0; zOffset = length;
        break;
      case 'bottomLeftFront':
        xOffset = width; yOffset = height; zOffset = 0;
        break;
      case 'bottomRightFront':
        xOffset = 0; yOffset = height; zOffset = 0;
        break;
      case 'topLeftFront':
        xOffset = width; yOffset = 0; zOffset = 0;
        break;
      case 'topRightFront':
        xOffset = 0; yOffset = 0; zOffset = 0;
        break;
      default:
        console.warn('Invalid pivot corner specified, defaulting to topLeftFront');
        xOffset = width; yOffset = 0; zOffset = 0;
    }

    // Calculate target constants
    const targetValues = [
      xOffset + position.x,
      width - xOffset + position.x,
      yOffset + position.y,
      height - yOffset + position.y,
      zOffset + position.z,
      length - zOffset + position.z
    ];

    const initialValues = clippingPlanes.map(plane => plane.constant);
    let startTime = null;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / (TRANSITION_DURATION * 1000), 1);
      
      // Ease function (power2.inOut equivalent)
      const eased = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      clippingPlanes.forEach((plane, index) => {
        const start = initialValues[index];
        const end = targetValues[index];
        plane.constant = start + (end - start) * eased;
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  } else {
    console.warn('Clipping planes not available or incorrect number');
  }
};
