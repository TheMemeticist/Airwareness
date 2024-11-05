import * as THREE from 'three';

const TRANSITION_DURATION = 2000; // Match camera transition duration
let currentTransition = null;

export const updateDimensions = (dimensions, clippingPlanes, pivotCorner = 'topLeftFront', position = { x: 0, y: 0, z: 0 }, animate = true) => {
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

    if (animate) {
      // Cancel any existing transition
      if (currentTransition) {
        cancelAnimationFrame(currentTransition.frameId);
      }

      // Store initial values
      const initialValues = clippingPlanes.map(plane => plane.constant);
      const startTime = Date.now();

      const animateTransition = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(1, elapsed / TRANSITION_DURATION);
        
        // Ease function (cubic)
        const easeProgress = progress * progress * (3 - 2 * progress);

        // Update each plane's constant
        clippingPlanes.forEach((plane, index) => {
          plane.constant = initialValues[index] + (targetValues[index] - initialValues[index]) * easeProgress;
        });

        if (progress < 1) {
          currentTransition = {
            frameId: requestAnimationFrame(animateTransition)
          };
        } else {
          currentTransition = null;
        }
      };

      animateTransition();
    } else {
      // Immediate update without animation
      clippingPlanes.forEach((plane, index) => {
        plane.constant = targetValues[index];
      });
    }
  } else {
    console.warn('Clipping planes not available or incorrect number');
  }
};
