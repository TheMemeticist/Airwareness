import * as THREE from 'three';

export const updateDimensions = (dimensions, clippingPlanes, pivotCorner = 'topLeftFront') => {
  console.log('UpdateDimensions called with:', { dimensions, clippingPlanes, pivotCorner });

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
        console.warn('Invalid pivot corner specified, defaulting to bottomLeftBack');
        xOffset = width; yOffset = height; zOffset = length;
    }

    // Update clipping planes based on pivot
    clippingPlanes[0].constant = xOffset;        // Right
    clippingPlanes[1].constant = width - xOffset; // Left
    clippingPlanes[2].constant = yOffset;        // Top
    clippingPlanes[3].constant = height - yOffset; // Bottom
    clippingPlanes[4].constant = zOffset;        // Front
    clippingPlanes[5].constant = length - zOffset; // Back

    console.log('Updated clipping planes:', clippingPlanes.map(plane => plane.constant));
  } else {
    console.warn('Clipping planes not available or incorrect number');
  }
};
