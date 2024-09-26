import * as THREE from 'three';

export const updateDimensions = (dimensions, clippingPlanes) => {
  console.log('UpdateDimensions called with:', { dimensions, clippingPlanes });

  const width = isNaN(dimensions.width) ? 1 : dimensions.width;
  const length = isNaN(dimensions.length) ? 1 : dimensions.length;
  const height = isNaN(dimensions.height) ? 1 : dimensions.height;

  if (clippingPlanes && clippingPlanes.length === 6) {
    clippingPlanes[0].constant = width / 2;
    clippingPlanes[1].constant = width / 2;
    clippingPlanes[2].constant = height / 2;
    clippingPlanes[3].constant = height / 2;
    clippingPlanes[4].constant = length / 2;
    clippingPlanes[5].constant = length / 2;
    console.log('Updated clipping planes:', clippingPlanes.map(plane => plane.constant));
  } else {
    console.warn('Clipping planes not available or incorrect number');
  }
};
