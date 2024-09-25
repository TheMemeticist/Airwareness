import * as THREE from 'three';

export const updateDimensions = (dimensions, cube, clippingPlanes) => {
  if (cube) {
    cube.geometry.dispose();
    cube.geometry = new THREE.BoxGeometry(
      dimensions.sideLength,
      dimensions.height,
      dimensions.sideLength
    );
  }

  if (clippingPlanes && clippingPlanes.length) {
    clippingPlanes[0].constant = dimensions.sideLength / 2;
    clippingPlanes[1].constant = dimensions.sideLength / 2;
    clippingPlanes[2].constant = dimensions.height / 2;
    clippingPlanes[3].constant = dimensions.height / 2;
    clippingPlanes[4].constant = dimensions.sideLength / 2;
    clippingPlanes[5].constant = dimensions.sideLength / 2;
  }
};
