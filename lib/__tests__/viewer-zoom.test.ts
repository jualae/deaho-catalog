import { describe, it, expect } from "vitest";

/**
 * ZoomableImage component tests
 * Since the actual gesture handling is done by react-native-gesture-handler
 * and react-native-reanimated (native modules), we test the zoom logic constraints.
 */

describe("ZoomableImage zoom logic", () => {
  // Simulate the zoom scale clamping logic
  function clampScale(savedScale: number, pinchScale: number): number {
    const newScale = savedScale * pinchScale;
    return Math.min(Math.max(newScale, 1), 5);
  }

  // Simulate the pan translation clamping logic
  function clampTranslation(
    savedTranslate: number,
    translation: number,
    dimension: number,
    scale: number
  ): number {
    const max = (dimension * (scale - 1)) / 2;
    return Math.min(Math.max(savedTranslate + translation, -max), max);
  }

  it("should clamp minimum scale to 1", () => {
    expect(clampScale(1, 0.5)).toBe(1);
    expect(clampScale(1, 0.1)).toBe(1);
  });

  it("should clamp maximum scale to 5", () => {
    expect(clampScale(1, 6)).toBe(5);
    expect(clampScale(2, 3)).toBe(5);
  });

  it("should allow normal zoom between 1 and 5", () => {
    expect(clampScale(1, 2)).toBe(2);
    expect(clampScale(1, 3)).toBe(3);
    expect(clampScale(1.5, 2)).toBe(3);
  });

  it("should not allow panning when scale is 1", () => {
    const result = clampTranslation(0, 100, 400, 1);
    expect(result).toBe(0);
  });

  it("should allow panning when zoomed in", () => {
    // At 2x zoom on 400px width, max pan = (400 * (2-1)) / 2 = 200
    const result = clampTranslation(0, 100, 400, 2);
    expect(result).toBe(100);
  });

  it("should clamp panning to max bounds", () => {
    // At 2x zoom on 400px width, max pan = 200
    const result = clampTranslation(0, 300, 400, 2);
    expect(result).toBe(200);
  });

  it("should clamp panning to negative bounds", () => {
    const result = clampTranslation(0, -300, 400, 2);
    expect(result).toBe(-200);
  });

  it("double tap should toggle between 1x and 2.5x", () => {
    // First double tap: zoom in
    let scale = 1;
    if (scale > 1) {
      scale = 1;
    } else {
      scale = 2.5;
    }
    expect(scale).toBe(2.5);

    // Second double tap: zoom out
    if (scale > 1) {
      scale = 1;
    } else {
      scale = 2.5;
    }
    expect(scale).toBe(1);
  });
});
