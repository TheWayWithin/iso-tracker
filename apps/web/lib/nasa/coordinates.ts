/**
 * Coordinate Transformation Utilities
 *
 * Converts between different coordinate systems for orbital visualization:
 * - Celestial coordinates (RA, Dec) from NASA Horizons
 * - Heliocentric 3D Cartesian coordinates (x, y, z with Sun at origin)
 * - 2D screen coordinates for Canvas rendering
 */

export interface Cartesian3D {
  x: number; // AU
  y: number; // AU
  z: number; // AU
}

export interface Cartesian2D {
  x: number; // pixels
  y: number; // pixels
}

/**
 * Convert RA, Dec, and distance to heliocentric 3D Cartesian coordinates
 *
 * @param ra - Right Ascension in degrees
 * @param dec - Declination in degrees
 * @param distance - Distance from observer (Earth) in AU
 * @returns 3D Cartesian coordinates with Sun at origin
 */
export function raDecToCartesian(ra: number, dec: number, distance: number): Cartesian3D {
  // Convert degrees to radians
  const raRad = (ra * Math.PI) / 180;
  const decRad = (dec * Math.PI) / 180;

  // Convert spherical to Cartesian (geocentric first)
  const x = distance * Math.cos(decRad) * Math.cos(raRad);
  const y = distance * Math.cos(decRad) * Math.sin(raRad);
  const z = distance * Math.sin(decRad);

  return { x, y, z };
}

/**
 * Project 3D coordinates onto 2D screen coordinates
 * Uses simple orthographic projection (top-down view)
 *
 * @param coords - 3D Cartesian coordinates
 * @param canvasWidth - Canvas width in pixels
 * @param canvasHeight - Canvas height in pixels
 * @param scale - AU per pixel (smaller = more zoomed in)
 * @param panX - Pan offset X in pixels
 * @param panY - Pan offset Y in pixels
 * @returns 2D screen coordinates
 */
export function projectTo2D(
  coords: Cartesian3D,
  canvasWidth: number,
  canvasHeight: number,
  scale: number,
  panX: number = 0,
  panY: number = 0
): Cartesian2D {
  // Canvas center
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  // Convert AU to pixels and apply pan
  // Y is flipped because canvas Y increases downward
  const screenX = centerX + (coords.x / scale) + panX;
  const screenY = centerY - (coords.y / scale) + panY;

  return { x: screenX, y: screenY };
}

/**
 * Calculate distance in AU between two 3D points
 */
export function distance3D(a: Cartesian3D, b: Cartesian3D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Planetary orbits data for reference visualization
 * Mean orbital radii in AU
 */
export const PLANETS = [
  { name: 'Mercury', radius: 0.387, color: '#8C7853' },
  { name: 'Venus', radius: 0.723, color: '#FFC649' },
  { name: 'Earth', radius: 1.0, color: '#4A90E2' },
  { name: 'Mars', radius: 1.524, color: '#E27B58' },
  { name: 'Jupiter', radius: 5.203, color: '#C88B3A' },
] as const;

/**
 * Calculate appropriate scale factor for visualization
 * Based on the maximum distance in the trajectory
 */
export function calculateAutoScale(
  trajectoryPoints: Cartesian3D[],
  canvasWidth: number,
  canvasHeight: number,
  padding: number = 50
): number {
  if (trajectoryPoints.length === 0) {
    return 0.05; // Default scale (20 AU per pixel)
  }

  // Find max distance from origin
  let maxDistance = 0;
  for (const point of trajectoryPoints) {
    const distance = Math.sqrt(point.x * point.x + point.y * point.y);
    if (distance > maxDistance) {
      maxDistance = distance;
    }
  }

  // Add some padding and calculate scale
  // Scale = AU per pixel
  const usableWidth = Math.min(canvasWidth, canvasHeight) - (padding * 2);
  const scale = maxDistance / (usableWidth / 2);

  return scale;
}

/**
 * Interpolate between two 3D points
 * Useful for smooth trajectory rendering
 */
export function interpolate3D(a: Cartesian3D, b: Cartesian3D, t: number): Cartesian3D {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

/**
 * Check if a point is within canvas bounds
 */
export function isInBounds(
  point: Cartesian2D,
  canvasWidth: number,
  canvasHeight: number,
  margin: number = 0
): boolean {
  return (
    point.x >= -margin &&
    point.x <= canvasWidth + margin &&
    point.y >= -margin &&
    point.y <= canvasHeight + margin
  );
}
