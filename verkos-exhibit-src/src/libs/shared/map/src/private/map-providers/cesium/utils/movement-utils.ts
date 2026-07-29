import {
  Cartesian2,
  Cartesian3,
  Cartographic,
  Ellipsoid,
  HeightReference,
  JulianDate,
  SceneMode,
  Viewer,
} from 'cesium';

/**
 * Defines the structure of a picked entity for height reference handling
 */
export interface PickedEntity {
  id: {
    position: {
      getValue: (date: JulianDate) => Cartesian3;
    };
  };
  primitive?: {
    heightReference?: HeightReference;
  };
}

/**
 * Handles entity movement based on height reference
 * @param viewer The Cesium viewer instance
 * @param mousePosition The 2D screen position of the mouse
 * @param pickedEntity The picked entity or primitive
 * @param sceneMode The current scene mode
 * @returns The new cartesian position or null if it couldn't be determined
 */
export function handleMovementWithHeightReference(
  viewer: Viewer,
  mousePosition: Cartesian2,
  pickedEntity: PickedEntity,
  sceneMode: SceneMode = SceneMode.SCENE3D
): Cartesian3 | null {
  // Get the current position and extract height before doing any calculations
  const primitivePosition = pickedEntity.id.position.getValue(
    JulianDate.fromDate(new Date())
  );
  const currentCartographic =
    viewer.scene.globe.ellipsoid.cartesianToCartographic(primitivePosition);
  const currentHeight = currentCartographic.height;
  const heightReference =
    pickedEntity.primitive?.heightReference || HeightReference.NONE;

  if (sceneMode === SceneMode.SCENE3D) {
    // 3D mode handling
    switch (heightReference) {
      case HeightReference.NONE: {
        // Get the new lat/lng from camera ray intersection with Earth's surface
        const ray = viewer.camera.getPickRay(mousePosition);
        if (ray) {
          const groundCartesian = viewer.scene.globe.pick(ray, viewer.scene);
          if (groundCartesian) {
            // Convert to cartographic to access individual components
            const groundCartographic =
              viewer.scene.globe.ellipsoid.cartesianToCartographic(
                groundCartesian
              );

            // Create new cartographic with preserved height (same as 2D mode logic)
            const newCartographic = new Cartographic(
              groundCartographic.longitude,
              groundCartographic.latitude,
              currentHeight // Preserve the original altitude exactly
            );

            // Convert back to cartesian
            return Ellipsoid.WGS84.cartographicToCartesian(newCartographic);
          }
        }
        return null;
      }

      // For CLAMP_TO_GROUND, RELATIVE_TO_GROUND, etc.
      default: {
        const ray = viewer.camera.getPickRay(mousePosition);
        if (ray) {
          const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
          return cartesian || null;
        }
        return null;
      }
    }
  } else if (sceneMode === SceneMode.SCENE2D) {
    // 2D mode handling with height preservation
    const ray = viewer.camera.getPickRay(mousePosition);
    if (ray) {
      // Get the new ground position in 2D
      const groundCartesian = viewer.scene.globe.pick(ray, viewer.scene);
      if (groundCartesian) {
        // Convert to cartographic to access individual components
        const groundCartographic =
          viewer.scene.globe.ellipsoid.cartesianToCartographic(groundCartesian);

        // Determine what height to use based on height reference
        let newHeight = currentHeight; // Default: preserve current height

        switch (heightReference) {
          case HeightReference.CLAMP_TO_GROUND:
          case HeightReference.CLAMP_TO_TERRAIN: {
            const terrainHeight =
              viewer.scene.globe.getHeight(groundCartographic);
            newHeight = terrainHeight !== undefined ? terrainHeight : 0;
            break;
          }
          case HeightReference.RELATIVE_TO_GROUND:
          case HeightReference.RELATIVE_TO_TERRAIN: {
            newHeight = groundCartographic.height;
            break;
          }
          case HeightReference.NONE:
          default:
            // For NONE, preserve the absolute height
            newHeight = currentHeight;
            break;
        }

        // Create new cartographic with the preserved height
        const newCartographic = new Cartographic(
          groundCartographic.longitude,
          groundCartographic.latitude,
          newHeight
        );

        // Convert back to cartesian
        return Ellipsoid.WGS84.cartographicToCartesian(newCartographic);
      }
    }
    return null;
  } else {
    console.warn('Unsupported scene mode for entity movement');
    return null;
  }
}

/**
 * Handles entity height manipulation based on mouse movement
 * @param viewer The Cesium viewer instance
 * @param originalPosition The original entity position
 * @param movement The mouse movement event with startPosition and endPosition
 * @param cumulativeHeightChange Current accumulated height change (default 0)
 * @returns Object with new cartesian position and updated height change value
 */
export function handleHeightManipulation(
  viewer: Viewer,
  originalPosition: Cartesian3,
  movement: {
    startPosition?: Cartesian2;
    endPosition?: Cartesian2;
  },
  cumulativeHeightChange = 0
): { position: Cartesian3; heightChange: number } {
  // Get camera position for distance-based scaling
  const cameraPosition = viewer.camera.position;
  const distance = Cartesian3.distance(cameraPosition, originalPosition);

  // Calculate mouse movement delta (negative deltaY means mouse moved up)
  // Note: In the reference code, movement direction is reversed - (end - start) vs (start - end)
  // Aligning with the reference implementation
  const deltaY =
    (movement.endPosition?.y || 0) - (movement.startPosition?.y || 0);

  // Adjust scaling factor based on distance (using 0.00099 as in reference)
  const scalingFactor = 0.00099 * distance;
  // In reference code, negative multiplier is used to flip the direction
  const heightAdjustment = -1 * deltaY * scalingFactor;

  // Update cumulative height change
  const newHeightChange = cumulativeHeightChange + heightAdjustment;

  // Convert to cartographic for height manipulation
  const cartographic = Cartographic.fromCartesian(originalPosition);

  // Apply height change to original height
  cartographic.height += heightAdjustment;

  // Convert back to cartesian with new height
  const newPosition = Cartesian3.fromRadians(
    cartographic.longitude,
    cartographic.latitude,
    cartographic.height
  );

  return {
    position: newPosition,
    heightChange: newHeightChange,
  };
}
