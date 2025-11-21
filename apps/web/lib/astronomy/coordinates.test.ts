/**
 * Unit tests for astronomical coordinate transformations
 *
 * Test values verified against known astronomical calculations and planetarium software
 */

import { describe, it, expect } from '@jest/globals';
import {
  calculateGMST,
  calculateLocalSiderealTime,
  raDecToAltAz,
  applyRefraction,
  isAboveHorizon,
  angularSeparation,
  type ObserverLocation,
  type CelestialPosition,
} from './coordinates';

describe('Coordinate Transformations', () => {
  // Test data: Sirius position and Greenwich location
  const sirius: CelestialPosition = {
    rightAscension: 6.7525,  // 6h 45m 09s
    declination: -16.7161,   // -16° 42' 58"
  };

  const greenwich: ObserverLocation = {
    latitude: 51.4779,
    longitude: 0.0015,
    elevation: 0,
  };

  describe('calculateGMST', () => {
    it('should calculate GMST correctly for J2000 epoch', () => {
      // J2000.0 epoch: 2000-01-01 12:00:00 UTC
      // Expected GMST: ~18.697374558 hours
      const date = new Date('2000-01-01T12:00:00Z');
      const gmst = calculateGMST(date);

      expect(gmst).toBeCloseTo(18.697, 2);
    });

    it('should calculate GMST for a known date', () => {
      // 2024-01-01 00:00:00 UTC
      // GMST should be approximately 6.66 hours
      const date = new Date('2024-01-01T00:00:00Z');
      const gmst = calculateGMST(date);

      expect(gmst).toBeGreaterThan(0);
      expect(gmst).toBeLessThan(24);
    });

    it('should return value in 0-24 hour range', () => {
      const date = new Date();
      const gmst = calculateGMST(date);

      expect(gmst).toBeGreaterThanOrEqual(0);
      expect(gmst).toBeLessThan(24);
    });
  });

  describe('calculateLocalSiderealTime', () => {
    it('should calculate LST by adding longitude', () => {
      const date = new Date('2024-01-01T00:00:00Z');
      const gmst = calculateGMST(date);
      const lst = calculateLocalSiderealTime(15, date); // 15° E

      // LST should be GMST + 1 hour (15°/15 = 1h)
      expect(lst).toBeCloseTo(gmst + 1, 1);
    });

    it('should wrap LST to 0-24 hour range', () => {
      const date = new Date('2024-01-01T00:00:00Z');
      const lst = calculateLocalSiderealTime(180, date); // 180° E

      expect(lst).toBeGreaterThanOrEqual(0);
      expect(lst).toBeLessThan(24);
    });

    it('should handle negative longitudes', () => {
      const date = new Date('2024-01-01T00:00:00Z');
      const lst = calculateLocalSiderealTime(-75, date); // New York longitude

      expect(lst).toBeGreaterThanOrEqual(0);
      expect(lst).toBeLessThan(24);
    });
  });

  describe('raDecToAltAz', () => {
    it('should convert celestial to horizontal coordinates', () => {
      // Test at a specific time when Sirius is visible from Greenwich
      const date = new Date('2024-01-15T22:00:00Z');
      const horizontal = raDecToAltAz(sirius, greenwich, date);

      expect(horizontal.altitude).toBeGreaterThan(-90);
      expect(horizontal.altitude).toBeLessThan(90);
      expect(horizontal.azimuth).toBeGreaterThanOrEqual(0);
      expect(horizontal.azimuth).toBeLessThan(360);
    });

    it('should handle objects near the north celestial pole', () => {
      const polaris: CelestialPosition = {
        rightAscension: 2.5301,  // Polaris RA
        declination: 89.2641,    // Polaris Dec (close to +90°)
      };

      const date = new Date();
      const horizontal = raDecToAltAz(polaris, greenwich, date);

      // At Greenwich (51.5°N), Polaris should be ~51.5° above horizon
      expect(horizontal.altitude).toBeGreaterThan(40);
      expect(horizontal.altitude).toBeLessThan(60);
    });

    it('should handle southern hemisphere locations', () => {
      const sydney: ObserverLocation = {
        latitude: -33.8688,
        longitude: 151.2093,
        elevation: 0,
      };

      const date = new Date();
      const horizontal = raDecToAltAz(sirius, sydney, date);

      expect(horizontal.altitude).toBeGreaterThan(-90);
      expect(horizontal.altitude).toBeLessThan(90);
    });

    it('should produce consistent azimuth values', () => {
      const date = new Date('2024-01-15T22:00:00Z');

      // Calculate multiple times - should be deterministic
      const h1 = raDecToAltAz(sirius, greenwich, date);
      const h2 = raDecToAltAz(sirius, greenwich, date);

      expect(h1.altitude).toEqual(h2.altitude);
      expect(h1.azimuth).toEqual(h2.azimuth);
    });
  });

  describe('applyRefraction', () => {
    it('should increase altitude for objects above horizon', () => {
      const altitude = 30;
      const corrected = applyRefraction(altitude);

      expect(corrected).toBeGreaterThan(altitude);
      expect(corrected - altitude).toBeLessThan(0.1); // Refraction < 6 arcmin
    });

    it('should apply more refraction at lower altitudes', () => {
      const low = applyRefraction(5);
      const high = applyRefraction(45);

      const lowCorrection = low - 5;
      const highCorrection = high - 45;

      expect(lowCorrection).toBeGreaterThan(highCorrection);
    });

    it('should not apply refraction below -1 degree', () => {
      const altitude = -5;
      const corrected = applyRefraction(altitude);

      expect(corrected).toEqual(altitude);
    });

    it('should adjust for temperature and pressure', () => {
      const altitude = 30;
      const standard = applyRefraction(altitude, 10, 1010);
      const hot = applyRefraction(altitude, 30, 1010);
      const lowPressure = applyRefraction(altitude, 10, 950);

      // Higher temperature = less refraction
      expect(hot).toBeLessThan(standard);

      // Lower pressure = less refraction
      expect(lowPressure).toBeLessThan(standard);
    });
  });

  describe('isAboveHorizon', () => {
    it('should return true for positive altitudes', () => {
      expect(isAboveHorizon(10)).toBe(true);
      expect(isAboveHorizon(45)).toBe(true);
      expect(isAboveHorizon(89)).toBe(true);
    });

    it('should return false for negative altitudes', () => {
      expect(isAboveHorizon(-1)).toBe(false);
      expect(isAboveHorizon(-10)).toBe(false);
      expect(isAboveHorizon(-45)).toBe(false);
    });

    it('should handle custom minimum altitude', () => {
      expect(isAboveHorizon(5, 10)).toBe(false);
      expect(isAboveHorizon(15, 10)).toBe(true);
    });

    it('should handle zero altitude', () => {
      expect(isAboveHorizon(0)).toBe(true);
      expect(isAboveHorizon(0, 5)).toBe(false);
    });
  });

  describe('angularSeparation', () => {
    it('should calculate separation between two positions', () => {
      const betelgeuse: CelestialPosition = {
        rightAscension: 5.9194,
        declination: 7.4070,
      };

      // Sirius and Betelgeuse are separated by ~25 degrees
      const separation = angularSeparation(sirius, betelgeuse);

      expect(separation).toBeGreaterThan(20);
      expect(separation).toBeLessThan(30);
    });

    it('should return 0 for identical positions', () => {
      const separation = angularSeparation(sirius, sirius);

      expect(separation).toBeCloseTo(0, 5);
    });

    it('should handle positions in different hemispheres', () => {
      const north: CelestialPosition = {
        rightAscension: 10,
        declination: 45,
      };

      const south: CelestialPosition = {
        rightAscension: 10,
        declination: -45,
      };

      const separation = angularSeparation(north, south);

      expect(separation).toBeCloseTo(90, 0);
    });

    it('should be commutative', () => {
      const betelgeuse: CelestialPosition = {
        rightAscension: 5.9194,
        declination: 7.4070,
      };

      const sep1 = angularSeparation(sirius, betelgeuse);
      const sep2 = angularSeparation(betelgeuse, sirius);

      expect(sep1).toBeCloseTo(sep2, 10);
    });
  });
});
