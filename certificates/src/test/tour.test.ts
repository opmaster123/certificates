import { describe, it, expect, beforeEach } from 'vitest';
import {
  createBigTourTestsSteps,
  createBigTourTestTakingSteps,
  createBigTourCertificatesSteps,
  createBigTourPaymentSteps,
  bigTourFinalSteps,
  TOUR_STORAGE_KEYS,
  hasSeenTour,
  markTourSeen,
  resetAllTours,
  createTour,
  isBigTourActive,
  getBigTourStage,
  cancelBigTour,
  startFullBigTour,
  runBigTourTestTaking,
} from '../services/tour';

describe('Big Multi-Page Tour Service (A to Z)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should define valid steps for all legs of the big tour', () => {
    const mockNavigate = () => {};
    const testSteps = createBigTourTestsSteps(mockNavigate);
    const takingSteps = createBigTourTestTakingSteps(mockNavigate);
    const certSteps = createBigTourCertificatesSteps(mockNavigate);
    const paySteps = createBigTourPaymentSteps(mockNavigate);

    expect(testSteps.length).toBeGreaterThan(0);
    expect(takingSteps.length).toBeGreaterThan(0);
    expect(certSteps.length).toBeGreaterThan(0);
    expect(paySteps.length).toBeGreaterThan(0);
    expect(bigTourFinalSteps.length).toBeGreaterThan(0);

    testSteps.forEach((step) => {
      expect(step.element).toBeDefined();
      expect(step.popover?.title).toBeDefined();
      expect(step.popover?.description).toBeDefined();
    });

    takingSteps.forEach((step) => {
      expect(step.element).toBeDefined();
      expect(step.popover?.title).toBeDefined();
      expect(step.popover?.description).toBeDefined();
    });
  });

  it('should track big tour stages in sessionStorage and allow cancellation', () => {
    expect(isBigTourActive()).toBe(false);
    expect(getBigTourStage()).toBeNull();

    const mockNavigate = () => {};
    startFullBigTour(mockNavigate);

    expect(isBigTourActive()).toBe(true);
    expect(getBigTourStage()).toBe('tests');

    cancelBigTour();
    expect(isBigTourActive()).toBe(false);
    expect(getBigTourStage()).toBeNull();
  });

  it('should correctly track and reset tour seen states in localStorage', () => {
    expect(hasSeenTour(TOUR_STORAGE_KEYS.TESTS)).toBe(false);

    markTourSeen(TOUR_STORAGE_KEYS.TESTS);
    expect(hasSeenTour(TOUR_STORAGE_KEYS.TESTS)).toBe(true);

    resetAllTours();
    expect(hasSeenTour(TOUR_STORAGE_KEYS.TESTS)).toBe(false);
  });

  it('should instantiate driver.js with custom options without error and handle onDoneClick', () => {
    let completed = false;
    const mockNavigate = () => {};
    const steps = createBigTourTestsSteps(mockNavigate);
    const driverInst = createTour(steps, {
      onComplete: () => {
        completed = true;
      },
    });

    expect(driverInst).toBeDefined();
    expect(typeof driverInst.drive).toBe('function');
    expect(typeof driverInst.destroy).toBe('function');
    expect(completed).toBe(false);

    // Verify onDoneClick behavior
    const config = driverInst.getConfig();
    expect(typeof config.onDoneClick).toBe('function');
    config.onDoneClick?.(undefined, steps[0], { driver: driverInst } as any);
    expect(completed).toBe(true);
  });
});
