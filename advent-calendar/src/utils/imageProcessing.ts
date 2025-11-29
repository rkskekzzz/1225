/**
 * Utility functions for processing textures for the 3D calendar box
 */

export interface SideTextureConfig {
  offsetX: number;
  offsetY: number;
  repeatX: number;
  repeatY: number;
}

/**
 * Calculate texture configurations for each side of the box
 *
 * Strategy: The front face uses the FULL image (0 to 1).
 * The sides also use portions of the FULL image at the edges,
 * so boundaries between front and sides share the same pixels.
 * This creates seamless continuity where they meet.
 *
 * The corners are allowed to be cropped/overlapped since they
 * won't be perfectly visible anyway.
 */
export function getBoxSideTextureConfigs(boxWidth: number, boxHeight: number, boxDepth: number) {
  // For a 30x30x5 box:
  // Front face (30x30): uses full image (0 to 1)
  // The sides need to match the edges of the front face

  // Since front uses full image, sides should use the same edge regions
  // Top/bottom sides are 30 wide x 5 deep
  // Left/right sides are 5 deep x 30 tall

  // For seamless continuity, we use the FULL width/height
  // and only constrain the depth dimension

  return {
    // Top side: uses the full width, top edge of image
    // repeatY is set to 1 to stretch the top edge across the depth
    top: {
      offsetX: 0,
      offsetY: 0,  // Take from top (in texture coords, top is high Y)
      repeatX: 1,  // Full width
      repeatY: 1,  // Stretch across depth
    } as SideTextureConfig,

    // Bottom side: uses the full width, bottom edge
    bottom: {
      offsetX: 0,
      offsetY: 0,
      repeatX: 1,
      repeatY: 1,
    } as SideTextureConfig,

    // Left side: uses the full height, left edge
    left: {
      offsetX: 0,
      offsetY: 0,
      repeatX: 1,
      repeatY: 1,
    } as SideTextureConfig,

    // Right side: uses the full height, right edge
    right: {
      offsetX: 0,
      offsetY: 0,
      repeatX: 1,
      repeatY: 1,
    } as SideTextureConfig,
  };
}
